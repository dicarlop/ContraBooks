import { fyo } from 'src/initFyo';

export interface BackupSnapshot {
  format: 'ContraBooks Backup';
  version: 1;
  createdAt: string;
  companyName: string;
  records: Record<string, unknown[]>;
}

export async function createBackupSnapshot(): Promise<BackupSnapshot> {
  const records: Record<string, unknown[]> = {};
  const schemas = Object.values(fyo.schemaMap).filter(
    (schema) => !schema.isChild && !schema.isSingle
  );

  for (const schema of schemas) {
    const fields = (schema.fields ?? [])
      .filter((field) => field.fieldtype !== 'Table')
      .map((field) => field.fieldname);

    if (!fields.length) {
      continue;
    }

    records[schema.name] = (await fyo.db.getAllRaw(schema.name, {
      fields,
    })) as unknown[];
  }

  return {
    format: 'ContraBooks Backup',
    version: 1,
    createdAt: new Date().toISOString(),
    companyName: String(fyo.singles.AccountingSettings?.companyName ?? ''),
    records,
  };
}

export function getBackupFileName(companyName = ''): string {
  const safeName = companyName
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  return `${safeName || 'contrabooks'}-backup-${date}.json`;
}
