import test from 'tape';
import { BankReconciliation } from '../models/baseModels/BankReconciliation/BankReconciliation';
import { ModelNameEnum } from '../models/types';

test('bank reconciliation: totals reconciled statement entries in date range', async (t) => {
  const fyo = {
    pesa: (value: number) => ({
      value,
      add(other: { value: number }) {
        return fyo.pesa(value + other.value);
      },
    }),
    db: {
      getAllRaw: async (schemaName: string, options: unknown) => {
        t.equal(schemaName, ModelNameEnum.BankStatementEntry, 'uses bank statement entries');
        t.deepEqual(
          options,
          {
            fields: ['date', 'amount', 'reconciled'],
            filters: { account: 'BANK-001', reconciled: true },
          },
          'filters to the selected bank account and reconciled entries'
        );
        return [
          { date: '2026-09-01', amount: 100, reconciled: true },
          { date: '2026-09-15', amount: -25, reconciled: true },
          { date: '2026-09-20', amount: 500, reconciled: true },
        ];
      },
    },
  };

  const doc = {
    account: 'BANK-001',
    fromDate: '2026-09-01',
    toDate: '2026-09-15',
    fyo,
  } as unknown as BankReconciliation;

  const result = await doc.getReconciledAmount();
  t.equal(result.value, 75, 'only in-range reconciled transactions are included');
  t.end();
});
