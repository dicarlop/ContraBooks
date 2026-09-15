import BetterSQLite3 from 'better-sqlite3';
import fs from 'fs-extra';
import { DatabaseError } from 'fyo/utils/errors';
import path from 'path';
import os from 'os';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { getMapFromList } from 'utils/index';
import { Version } from 'utils/version';
import { getSchemas } from '../../schemas';
import { databaseMethodSet, unlinkIfExists } from '../helpers';
import {
  decryptCompanyFile,
  encryptCompanyFile,
  isEncryptedCompanyFile,
} from '../security/companyFileEncryption';
import patches from '../patches';
import { BespokeQueries } from './bespoke';
import DatabaseCore from './core';
import { runPatches } from './runPatch';
import { BespokeFunction, Patch, RawCustomField } from './types';

export class DatabaseManager extends DatabaseDemuxBase {
  db?: DatabaseCore;
  rawCustomFields: RawCustomField[] = [];
  #storageDbPath?: string;
  #workingDbPath?: string;
  #encryptionPassword?: string;
  #workingDbDir?: string;

  get #isInitialized(): boolean {
    return this.db !== undefined && this.db.knex !== undefined;
  }

  async createNewDatabase(
    dbPath: string,
    countryCode: string,
    password?: string
  ) {
    await unlinkIfExists(dbPath);
    const workingPath = password
      ? await this.#createWorkingDatabasePath()
      : dbPath;

    this.#setEncryptionState(dbPath, workingPath, password);
    try {
      return await this.connectToDatabase(workingPath, countryCode);
    } catch (error) {
      await this.#clearEncryptionState();
      throw error;
    }
  }

  async connectToDatabase(
    dbPath: string,
    countryCode?: string,
    password?: string
  ) {
    const resolvedPath = await this.#resolveDatabasePath(dbPath, password);
    if (resolvedPath !== dbPath) {
      this.#setEncryptionState(dbPath, resolvedPath, password);
    } else if (this.#storageDbPath === undefined && password) {
      this.#setEncryptionState(dbPath, dbPath, password);
    }

    try {
      countryCode = await this._connect(resolvedPath, countryCode);
      await this.#migrate();
      return countryCode;
    } catch (error) {
      if (resolvedPath !== dbPath) {
        await this.#clearEncryptionState();
      }
      throw error;
    }
  }

  async _connect(dbPath: string, countryCode?: string) {
    countryCode ??= await DatabaseCore.getCountryCode(dbPath);
    this.db = new DatabaseCore(dbPath);
    await this.db.connect();
    await this.setRawCustomFields();
    const schemaMap = getSchemas(countryCode, this.rawCustomFields);
    this.db.setSchemaMap(schemaMap);
    return countryCode;
  }

  async setRawCustomFields() {
    try {
      this.rawCustomFields = (await this.db?.knex?.(
        'CustomField'
      )) as RawCustomField[];
    } catch {}
  }

  async #migrate(): Promise<void> {
    if (!this.#isInitialized) {
      return;
    }

    const isFirstRun = await this.#getIsFirstRun();
    if (isFirstRun) {
      await this.db!.migrate();
    }

    await this.#executeMigration();
  }

  async #executeMigration() {
    const version = await this.#getAppVersion();
    const patches = await this.#getPatchesToExecute(version);

    const hasPatches = !!patches.pre.length || !!patches.post.length;
    if (hasPatches) {
      await this.#createBackup();
    }

    await runPatches(patches.pre, this, version);
    await this.db!.migrate({
      pre: async () => {
        if (hasPatches) {
          return;
        }

        await this.#createBackup();
      },
    });
    await runPatches(patches.post, this, version);
  }

  async #getPatchesToExecute(
    version: string
  ): Promise<{ pre: Patch[]; post: Patch[] }> {
    if (this.db === undefined) {
      return { pre: [], post: [] };
    }

    const query = (await this.db.knex!('PatchRun').select()) as {
      name: string;
      version?: string;
      failed?: boolean;
    }[];

    const runPatchesMap = getMapFromList(query, 'name');
    const filtered = patches
      .filter((p) => {
        const exec = runPatchesMap[p.name];
        if (!exec && Version.lte(version, p.version)) {
          return true;
        }

        if (exec?.failed && exec?.version !== version) {
          return true;
        }

        return false;
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return {
      pre: filtered.filter((p) => p.patch.beforeMigrate),
      post: filtered.filter((p) => !p.patch.beforeMigrate),
    };
  }

  async call(method: DatabaseMethod, ...args: unknown[]) {
    if (!this.#isInitialized) {
      return;
    }

    if (!databaseMethodSet.has(method)) {
      return;
    }

    // @ts-ignore
    const response = await this.db[method](...args);
    if (method === 'close') {
      delete this.db;
      await this.#finalizeEncryptedFile();
    }

    return response;
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    if (!this.#isInitialized) {
      return;
    }

    if (!BespokeQueries.hasOwnProperty(method)) {
      throw new DatabaseError(`invalid bespoke db function ${method}`);
    }

    const queryFunction: BespokeFunction =
      BespokeQueries[method as keyof BespokeFunction];
    return await queryFunction(this.db!, ...args);
  }

  async #getIsFirstRun(): Promise<boolean> {
    const knex = this.db?.knex;
    if (!knex) {
      return true;
    }

    const query = await knex('sqlite_master').where({
      type: 'table',
      name: 'PatchRun',
    });
    return !query.length;
  }

  async #createBackup() {
    const { dbPath } = this.db ?? {};
    if (!dbPath || process.env.IS_TEST) {
      return;
    }

    const backupPath = await this.#getBackupFilePath();
    if (!backupPath) {
      return;
    }

    const db = this.getDriver();
    await db?.backup(backupPath).then(() => db.close());
  }

  async #getBackupFilePath() {
    const dbPath = this.#storageDbPath ?? this.db?.dbPath;
    if (dbPath === ':memory:' || !dbPath) {
      return null;
    }

    let fileName = path.parse(dbPath).name;
    if (fileName.endsWith('.books')) {
      fileName = fileName.slice(0, -6);
    }

    const backupFolder = path.join(path.dirname(dbPath), 'backups');
    const date = new Date().toISOString().split('T')[0];
    const version = await this.#getAppVersion();
    const backupFile = `${fileName}_${version}_${date}.books.db`;
    fs.ensureDirSync(backupFolder);
    return path.join(backupFolder, backupFile);
  }

  async #getAppVersion(): Promise<string> {
    const knex = this.db?.knex;
    if (!knex) {
      return '0.0.0';
    }

    const query = await knex('SingleValue')
      .select('value')
      .where({ fieldname: 'version', parent: 'SystemSettings' });
    const value = (query[0] as undefined | { value: string })?.value;
    return value || '0.0.0';
  }

  getDriver() {
    const { dbPath } = this.db ?? {};
    if (!dbPath) {
      return null;
    }

    return BetterSQLite3(dbPath, { readonly: true });
  }

  async #resolveDatabasePath(dbPath: string, password?: string): Promise<string> {
    if (!(await fs.pathExists(dbPath))) {
      return dbPath;
    }

    const header = await fs.readFile(dbPath).then((data) => data.subarray(0, 5));
    if (!isEncryptedCompanyFile(header)) {
      return dbPath;
    }

    if (!password) {
      throw new Error('Company file password is required');
    }

    const encrypted = await fs.readFile(dbPath);
    const plaintext = await decryptCompanyFile(encrypted, password);
    const workingPath = await this.#createWorkingDatabasePath();
    await fs.writeFile(workingPath, plaintext, { mode: 0o600 });
    return workingPath;
  }

  async #createWorkingDatabasePath(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'contrabooks-'));
    this.#workingDbDir = dir;
    const workingPath = path.join(dir, 'company.books.db');
    this.#workingDbPath = workingPath;
    return workingPath;
  }

  #setEncryptionState(
    storagePath: string,
    workingPath: string,
    password?: string
  ) {
    this.#storageDbPath = storagePath;
    this.#workingDbPath = workingPath;
    this.#encryptionPassword = password;
  }

  async #finalizeEncryptedFile() {
    if (
      !this.#storageDbPath ||
      !this.#workingDbPath ||
      !this.#encryptionPassword
    ) {
      await this.#clearEncryptionState();
      return;
    }

    const plaintext = await fs.readFile(this.#workingDbPath);
    const encrypted = await encryptCompanyFile(
      plaintext,
      this.#encryptionPassword
    );
    const replacementPath = `${this.#storageDbPath}.tmp`;
    await fs.writeFile(replacementPath, encrypted, { mode: 0o600 });
    await fs.move(replacementPath, this.#storageDbPath, { overwrite: true });
    await this.#clearEncryptionState();
  }

  async #clearEncryptionState() {
    const workingDir = this.#workingDbDir;
    this.#storageDbPath = undefined;
    this.#workingDbPath = undefined;
    this.#encryptionPassword = undefined;
    this.#workingDbDir = undefined;

    if (workingDir) {
      await fs.remove(workingDir);
    }
  }
}

export default new DatabaseManager();
