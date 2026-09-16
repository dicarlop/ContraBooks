import { DatabaseManager } from '../database/manager';

/**
 * Older company files can contain an EmailLog table created before the error
 * field was added. Repair it in place so email history queries keep working.
 */
async function execute(dm: DatabaseManager) {
  const knex = dm.db?.knex;
  if (!knex) return;

  const tableExists = await knex.schema.hasTable('EmailLog');
  if (!tableExists) return;

  const rows = (await knex.raw('PRAGMA table_info(EmailLog)')) as {
    name: string;
  }[];
  const columns = new Set(rows.map(({ name }) => name));
  if (columns.has('error')) return;

  await knex.schema.table('EmailLog', (table) => {
    table.text('error');
  });
}

export default { execute };
