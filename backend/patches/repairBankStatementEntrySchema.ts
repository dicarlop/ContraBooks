import { DatabaseManager } from '../database/manager';

/**
 * Older company files can contain a BankStatementEntry table created before
 * the reconciliation fields were introduced. Repair the table in place so
 * opening the list does not fail with "no such column" errors.
 */
async function execute(dm: DatabaseManager) {
  const knex = dm.db?.knex;
  if (!knex) return;

  const tableExists = await knex.schema.hasTable('BankStatementEntry');
  if (!tableExists) return;

  const rows = (await knex.raw('PRAGMA table_info(BankStatementEntry)')) as {
    name: string;
  }[];
  const columns = new Set(rows.map(({ name }) => name));

  const missingColumns: Record<string, string> = {
    account: 'text',
    date: 'date',
    description: 'text',
    reference: 'text',
    amount: 'text',
    reconciled: 'boolean',
    notes: 'text',
  };

  const missing = Object.entries(missingColumns).filter(
    ([name]) => !columns.has(name)
  );
  if (!missing.length) return;

  await knex.schema.table('BankStatementEntry', (table) => {
    for (const [name, type] of missing) {
      if (type === 'date') table.date(name);
      else if (type === 'boolean') table.boolean(name).defaultTo(false);
      else table.text(name);
    }
  });
}

export default { execute };
