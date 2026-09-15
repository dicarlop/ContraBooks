import { DatabaseError, NotImplemented } from 'fyo/utils/errors';
import { SchemaMap } from 'schemas/types';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { BackendResponse } from 'utils/ipc/types';

export class DatabaseDemux extends DatabaseDemuxBase {
  #isElectron = false;
  constructor(isElectron: boolean) {
    super();
    this.#isElectron = isElectron;
  }

  async #handleDBCall(func: () => Promise<BackendResponse>): Promise<unknown> {
    const response = await func();
    if (response.error?.name) {
      const { name, message, stack } = response.error;
      const dberror = new DatabaseError(`${name}\n${message}`);
      dberror.stack = stack;
      throw dberror;
    }
    return response.data;
  }

  async getSchemaMap(): Promise<SchemaMap> {
    if (!this.#isElectron) throw new NotImplemented();
    return (await this.#handleDBCall(async () => ipc.db.getSchema())) as SchemaMap;
  }

  async createNewDatabase(dbPath: string, countryCode?: string, unlockKey?: string): Promise<string> {
    if (!this.#isElectron) throw new NotImplemented();
    return (await this.#handleDBCall(async () => ipc.db.create(dbPath, countryCode, unlockKey))) as string;
  }

  async connectToDatabase(dbPath: string, countryCode?: string, unlockKey?: string): Promise<string> {
    if (!this.#isElectron) throw new NotImplemented();
    return (await this.#handleDBCall(async () => ipc.db.connect(dbPath, countryCode, unlockKey))) as string;
  }

  async call(method: DatabaseMethod, ...args: unknown[]): Promise<unknown> {
    if (!this.#isElectron) throw new NotImplemented();
    return await this.#handleDBCall(async () => ipc.db.call(method, ...args));
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    if (!this.#isElectron) throw new NotImplemented();
    return await this.#handleDBCall(async () => ipc.db.bespoke(method, ...args));
  }
}
