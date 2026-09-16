import { Fyo, t } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import {
  CurrenciesMap,
  DefaultMap,
  FiltersMap,
  FormulaMap,
  HiddenMap,
} from 'fyo/model/types';
import { DEFAULT_CURRENCY } from 'fyo/utils/consts';
import { ValidationError } from 'fyo/utils/errors';
import { Transactional } from 'models/Transactional/Transactional';
import {
  addItem,
  canApplyCouponCode,
  canApplyPricingRule,
  createLoyaltyPointEntry,
  filterPricingRules,
  getAddedLPWithGrandTotal,
  getExchangeRate,
  getNumberSeries,
  removeUnusedCoupons,
  getPricingRulesConflicts,
  removeLoyaltyPoint,
  roundFreeItemQty,
  getReturnQtyTotal,
  getReturnLoyaltyPoints,
  getItemQtyMap,
  getItemVisibility,
  validateLoyaltyProgram,
  getLoyaltyProgramTier,
  isLoyaltyProgramExpiredAndMaxed,
} from 'models/helpers';
import { StockTransfer } from 'models/inventory/StockTransfer';
import { validateBatch } from 'models/inventory/helpers';
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { FieldTypeEnum, Schema } from 'schemas/types';
import { getIsNullOrUndef, joinMapLists, safeParseFloat } from 'utils';
import { Defaults } from '../Defaults/Defaults';
import { InvoiceItem } from '../InvoiceItem/InvoiceItem';
import { Item } from '../Item/Item';
import { Party } from '../Party/Party';
import { Payment } from '../Payment/Payment';
import { Tax } from '../Tax/Tax';
import { TaxSummary } from '../TaxSummary/TaxSummary';
import { ReturnDocItem } from 'models/inventory/types';
import { AccountFieldEnum, PaymentTypeEnum } from '../Payment/types';
import { PricingRule } from '../PricingRule/PricingRule';
import { ApplicablePricingRules } from './types';
import { PricingRuleDetail } from '../PricingRuleDetail/PricingRuleDetail';
import { LoyaltyProgram } from '../LoyaltyProgram/LoyaltyProgram';
import { AppliedCouponCodes } from '../AppliedCouponCodes/AppliedCouponCodes';
import { CouponCode } from '../CouponCode/CouponCode';
import { SalesInvoice } from '../SalesInvoice/SalesInvoice';
import { SalesInvoiceItem } from '../SalesInvoiceItem/SalesInvoiceItem';
import { PricingRuleItem } from '../PricingRuleItem/PricingRuleItem';
import { getLinkedEntries } from 'src/utils/doc';

export type TaxDetail = {
  account: string;
  payment_account?: string;
  rate: number;
};

export type ReturnedItemData =
  | number
  | {
      quantity?: number;
      batches?: Record<string, number>;
    };

export type InvoiceTaxItem = {
  details: TaxDetail;
  exchangeRate?: number;
  fullAmount: Money;
  taxAmount: Money;
};

export abstract class Invoice extends Transactional {
  _taxes: Record<string, Tax> = {};
  taxes?: TaxSummary[];

  items?: InvoiceItem[];
  coupons?: AppliedCouponCodes[];
  party?: string;
  account?: string;
  currency?: string;
  priceList?: string;
  netTotal?: Money;
  grandTotal?: Money;
  baseGrandTotal?: Money;
  outstandingAmount?: Money;
  exchangeRate?: number;
  setDiscountAmount?: boolean;
  discountAmount?: Money;
  discountPercent?: number;
  loyaltyPoints?: number;
  availableLoyaltyPoints?: number;
  discountAfterTax?: boolean;
  stockNotTransferred?: number;
  loyaltyProgram?: string;
  backReference?: string;
  submitted?: boolean;
  cancelled?: boolean;
  makeAutoPayment?: boolean;
  makeAutoStockTransfer?: boolean;

  isReturned?: boolean;
  returnAgainst?: string;
  isFullyReturned?: boolean;

  pricingRuleDetail?: PricingRuleDetail[];

  get isSales() {
    return (
      this.schemaName === 'SalesInvoice' || this.schemaName == 'SalesQuote'
    );
  }

  get isQuote() {
    return this.schemaName == 'SalesQuote';
  }

  get enableDiscounting() {
    return !!this.fyo.singles?.AccountingSettings?.enableDiscounting;
  }

  get isMultiCurrency() {
    if (!this.currency) {
      return false;
    }

    return this.fyo.singles.SystemSettings!.currency !== this.currency;
  }

  get companyCurrency() {
    return this.fyo.singles.SystemSettings?.currency ?? DEFAULT_CURRENCY;
  }

  get stockTransferSchemaName() {
    return this.isSales
      ? ModelNameEnum.Shipment
      : ModelNameEnum.PurchaseReceipt;
  }

  get hasLinkedTransfers() {
    if (!this.submitted) {
      return false;
    }

    return this.getStockTransferred() > 0;
  }

  get hasLinkedPayments() {
    if (!this.submitted) {
      return false;
    }

    return !this.baseGrandTotal?.eq(this.outstandingAmount!);
  }

  get paymentStatus() {
    if (!this.submitted || this.cancelled) {
      return 'Draft';
    }

    const outstanding = this.outstandingAmount ?? this.fyo.pesa(0);
    const total = this.baseGrandTotal ?? this.fyo.pesa(0);

    if (outstanding.lte(0)) {
      return 'Paid';
    }

    if (outstanding.lt(total)) {
      return 'Partially Paid';
    }

    return 'Unpaid';
  }

  get amountPaid() {
    const total = this.baseGrandTotal ?? this.fyo.pesa(0);
    const outstanding = this.outstandingAmount ?? this.fyo.pesa(0);
    const paid = total.sub(outstanding);
    return paid.gt(0) ? paid : this.fyo.pesa(0);
  }

  get autoPaymentAccount(): string | null {
    const fieldname = this.isSales
      ? 'salesPaymentAccount'
      : 'purchasePaymentAccount';
    const value = this.fyo.singles.Defaults?.[fieldname];
    if (typeof value === 'string' && value.length) {
      return value;
    }

    return null;
  }

  get autoStockTransferLocation(): string | null {
    const fieldname = this.isSales
      ? 'shipmentLocation'
      : 'purchaseReceiptLocation';
    const value = this.fyo.singles.Defaults?.[fieldname];
    if (typeof value === 'string' && value.length) {
      return value;
    }

    return null;
  }

  get isReturn(): boolean {
    return !!this.returnAgainst;
  }

  constructor(schema: Schema, data: DocValueMap, fyo: Fyo) {
    super(schema, data, fyo);
    this._setGetCurrencies();
  }

  async validate() {
    await super.validate();
    if (this.isQuote) {
      return;
    }
    if (!this.submitted && this.loyaltyProgram) {
      const isExpiredOrMaxed = await isLoyaltyProgramExpiredAndMaxed(
        this.fyo,
        this.loyaltyProgram
      );

      if (isExpiredOrMaxed) {
        const { showToast } = await import('src/utils/interactive');

        showToast({
          type: 'warning',
          message: t`Loyalty program has expired or reached maximum usage`,
          duration: 'short',
        });
      }
    }

    if (
      this.enableDiscounting &&
      this.discountPercent &&
      this.discountPercent > 100
    ) {
      throw new ValidationError(t`Discount percent cannot exceed 100`);
    }
  }

  // The remainder of this model is unchanged.
}
