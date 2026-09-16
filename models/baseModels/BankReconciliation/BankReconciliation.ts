import { Doc } from 'fyo/model/doc';
import { FormulaMap, ListViewSettings } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { QueryFilter } from 'utils/db/types';

export class BankReconciliation extends Doc {
  formulas: FormulaMap = {
    reconciledAmount: {
      formula: async () => this.getReconciledAmount(),
      dependsOn: ['account', 'fromDate', 'toDate'],
    },
    calculatedEndingBalance: {
      formula: () =>
        (this.fyo.pesa(this.openingBalance ?? 0) as Money).add(
          this.reconciledAmount as unknown as number
        ),
      dependsOn: ['openingBalance', 'reconciledAmount'],
    },
    difference: {
      formula: () =>
        (this.fyo.pesa(this.statementEndingBalance ?? 0) as Money).sub(
          this.calculatedEndingBalance as unknown as number
        ),
      dependsOn: ['statementEndingBalance', 'calculatedEndingBalance'],
    },
  };

  async getReconciledAmount(): Promise<Money> {
    if (!this.account || !this.fromDate || !this.toDate) {
      return this.fyo.pesa(0);
    }

    const rows = (await this.fyo.db.getAllRaw(ModelNameEnum.BankStatementEntry, {
      fields: ['date', 'amount', 'reconciled'],
      filters: {
        account: this.account,
        reconciled: true,
      } as QueryFilter,
    })) as { date: string | Date; amount: number | Money; reconciled: boolean }[];

    const from = new Date(this.fromDate as string | Date);
    const to = new Date(this.toDate as string | Date);
    to.setHours(23, 59, 59, 999);

    return rows
      .filter(({ date }) => {
        const value = new Date(date);
        return value >= from && value <= to;
      })
      .map(({ amount }) => this.fyo.pesa(amount as number))
      .reduce((total, amount) => total.add(amount), this.fyo.pesa(0));
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'account', 'fromDate', 'toDate', 'statementEndingBalance', 'difference'],
    };
  }
}
