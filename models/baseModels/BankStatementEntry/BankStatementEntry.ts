import { Doc } from 'fyo/model/doc';
import { FiltersMap, ListViewSettings } from 'fyo/model/types';
import { AccountTypeEnum } from '../Account/types';
import { QueryFilter } from 'utils/db/types';

export class BankStatementEntry extends Doc {
  static filters: FiltersMap = {
    account: () => ({
      accountType: AccountTypeEnum.Bank,
      isGroup: false,
    }) as QueryFilter,
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'account', 'date', 'description', 'reference', 'amount', 'reconciled'],
    };
  }
}
