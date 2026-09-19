import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum } from 'schemas/types';
import { PrintValues } from 'src/utils/types';
import { Money } from 'pesa';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { Payment } from 'models/baseModels/Payment/Payment';

type PrintTemplateData = Record<string, unknown>;

const printSettingsFields = [
  'logo',
  'displayLogo',
  'color',
  'font',
  'email',
  'phone',
  'address',
  'companyName',
  'amountInWords',
  'displaytermsandconditions',
  'termsAndConditions',
];
const accountingSettingsFields = ['gstin', 'taxId'];

export async function getPrintTemplatePropValues(doc: Doc): Promise<PrintValues> {
  const values: PrintValues = { doc: {}, print: {} };
  const fyo = doc.fyo;
  let paymentId: string[] | undefined;
  let sinvDoc: Invoice | undefined;

  values.doc = await getPrintTemplateDocValues(doc);

  if (
    values.doc.entryType === ModelNameEnum.SalesInvoice ||
    values.doc.entryType === ModelNameEnum.PurchaseInvoice
  ) {
    paymentId = await (doc as SalesInvoice).getPaymentIds();
    if (paymentId?.length) {
      (values.doc as PrintTemplateData).paymentDetails = await getPaymentDetails(doc, paymentId);
    }
  }

  if (doc.referenceType == ModelNameEnum.SalesInvoice) {
    const referenceName = (doc as Payment)?.for?.[0]?.referenceName;
    if (referenceName) {
      sinvDoc = (await fyo.doc.getDoc(ModelNameEnum.SalesInvoice, referenceName)) as Invoice;
      if (sinvDoc.taxes) (values.doc as PrintTemplateData).taxes = sinvDoc.taxes;
    }
  }

  let totalTax;
  if (values.doc.entryType !== ModelNameEnum.Shipment) {
    totalTax = await (sinvDoc ?? (doc as Payment))?.getTotalTax();
  }

  if (doc.schema.name == ModelNameEnum.Payment) {
    (values.doc as PrintTemplateData).amountPaidInWords = getGrandTotalInWords(
      (doc.amountPaid as Money)?.float
    );
  }

  const total = (doc.grandTotal as Money) ?? (doc.amount as Money);
  (values.doc as PrintTemplateData).subTotal = doc.fyo.format(total.sub(totalTax || 0), ModelNameEnum.Currency);
  (values.doc as PrintTemplateData).totalTax = doc.fyo.format(totalTax || 0, ModelNameEnum.Currency);

  if (doc.grandTotal && doc.outstandingAmount) {
    (values.doc as PrintTemplateData).paymentsAndCredits = doc.fyo.format(
      (doc.grandTotal as Money).sub(doc.outstandingAmount as Money),
      ModelNameEnum.Currency
    );
    (values.doc as PrintTemplateData).balanceDue = doc.fyo.format(
      doc.outstandingAmount as Money,
      ModelNameEnum.Currency
    );
  }

  const printSettings = await fyo.doc.getDoc(ModelNameEnum.PrintSettings);
  const accountingSettings = await fyo.doc.getDoc(ModelNameEnum.AccountingSettings);
  values.print = {
    ...(await getPrintTemplateDocValues(printSettings, printSettingsFields)),
    ...(await getPrintTemplateDocValues(accountingSettings, accountingSettingsFields)),
  };

  if (['Invoice', 'Quote'].some((value) => doc.schemaName?.endsWith(value))) {
    (values.doc as PrintTemplateData).totalDiscount = formattedTotalDiscount(doc);
  }
  (values.doc as PrintTemplateData).showHSN = showHSN(doc);
  (values.doc as PrintTemplateData).grandTotalInWords = getGrandTotalInWords(
    ((doc.grandTotal as Money) ?? (doc.amount as Money)).float
  );
  (values.doc as PrintTemplateData).date = getDate(doc.date as string);

  if (printSettings.displayTime) {
    (values.doc as PrintTemplateData).time = getTime(doc.date as string);
  }
  if (printSettings.displayDescription) {
    (values.doc as PrintTemplateData).description = showDescription(doc);
  }

  return values;
}

async function getPaymentDetails(doc: Doc, paymentId: string[]) {
  const paymentDetails = [];
  let outstandingAmount = doc.grandTotal as Money;
  for (const payment of paymentId.sort()) {
    const paymentDoc = await doc.fyo.doc.getDoc(ModelNameEnum.Payment, payment);
    outstandingAmount = outstandingAmount.sub(paymentDoc.amount as Money);
    paymentDetails.push({
      amount: doc.fyo.format(paymentDoc.amount, ModelNameEnum.Currency),
      amountPaid: doc.fyo.format(paymentDoc.amountPaid, ModelNameEnum.Currency),
      paymentMethod: paymentDoc.paymentMethod as string,
      outstandingAmount: doc.fyo.format(outstandingAmount, ModelNameEnum.Currency),
    });
  }
  return paymentDetails;
}

function getDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()}`;
}

function getTime(dateString: string): string {
  return new Date(dateString).toTimeString().split(' ')[0];
}

function getGrandTotalInWords(total: number) {
  const formattedTotal = total.toFixed(2);
  const [integerPart, decimalPart] = formattedTotal.split('.');
  const ones = ['', t`One`, t`Two`, t`Three`, t`Four`, t`Five`, t`Six`, t`Seven`, t`Eight`, t`Nine`];
  const teens = [t`Ten`, t`Eleven`, t`Twelve`, t`Thirteen`, t`Fourteen`, t`Fifteen`, t`Sixteen`, t`Seventeen`, t`Eighteen`, t`Nineteen`];
  const tens = ['', '', t`Twenty`, t`Thirty`, t`Forty`, t`Fifty`, t`Sixty`, t`Seventy`, t`Eighty`, t`Ninety`];
  const scales = ['', t`Thousand`, t`Million`, t`Billion`];

  function convertThreeDigitNumber(num: number) {
    let result = '';
    const hundredDigit = Math.floor(num / 100);
    const remainder = num % 100;
    if (hundredDigit > 0) result += ones[hundredDigit] + ` ${t`Hundred`}`;
    if (remainder > 0) {
      if (hundredDigit > 0) result += ` ${t`And`} `;
      if (remainder < 10) result += ones[remainder];
      else if (remainder < 20) result += teens[remainder - 10];
      else {
        result += tens[Math.floor(remainder / 10)];
        if (remainder % 10 > 0) result += ' ' + ones[remainder % 10];
      }
    }
    return result;
  }

  const integerGroups = integerPart.match(/(\d{1,3})(?=(\d{3})*$)/g) || [];
  let spelledOutInteger = '';
  integerGroups.forEach((group, index) => {
    const groupValue = parseInt(group);
    if (groupValue > 0) {
      const groupText = convertThreeDigitNumber(groupValue);
      const suffix = scales[integerGroups.length - index - 1];
      spelledOutInteger += groupText + (suffix ? ' ' + suffix : '') + ' ';
    }
  });
  spelledOutInteger = spelledOutInteger.trim() || t`Zero`;

  const decimalCents = parseInt(decimalPart);
  const spelledOutDecimal = decimalCents !== 0
    ? ` ${t`and`} ${convertThreeDigitNumber(decimalCents)} ${t`Paisa`}`
    : '';
  return `${spelledOutInteger}${spelledOutDecimal} ${t`only`}`;
}

function showHSN(doc: Doc): boolean {
  const items = doc.items;
  return Array.isArray(items) && items.map((i: Doc) => i.hsnCode).every(Boolean);
}

function showDescription(doc: Doc): boolean {
  const description = Array.isArray(doc.items)
    ? doc.items.map((item: Doc) => item.description).filter(Boolean)
    : [];
  return description.length > 0;
}

function formattedTotalDiscount(doc: Doc): string {
  if (!(doc instanceof Invoice)) return '';
  const totalDiscount = doc.getTotalDiscount();
  if (!totalDiscount?.float) return '';
  return doc.fyo.format(totalDiscount, ModelNameEnum.Currency);
}

async function getPrintTemplateDocValues(doc: Doc, fieldnames?: string[]) {
  const values: PrintTemplateData = {};
  if (!(doc instanceof Doc)) return values;
  let fields = doc.schema.fields;
  if (fieldnames) fields = fields.filter((f) => fieldnames.includes(f.fieldname));

  for (const field of fields) {
    const { fieldname, fieldtype, meta } = field;
    if (fieldtype === FieldTypeEnum.Attachment || meta) continue;
    const value = doc.get(fieldname);
    if (!value) {
      values[fieldname] = '';
      continue;
    }
    if (!Array.isArray(value)) {
      values[fieldname] = doc.fyo.format(value, field, doc);
      continue;
    }
    const table: PrintTemplateData[] = [];
    for (const row of value) table.push(await getPrintTemplateDocValues(row));
    values[fieldname] = table;
  }

  values.submitted = doc.submitted;
  values.entryType = doc.schema.name;
  values.entryLabel = doc.schema.label;

  await doc.loadLinks();
  const links: PrintTemplateData = {};
  for (const [linkName, linkDoc] of Object.entries(doc.links ?? {})) {
    links[linkName] = await getPrintTemplateDocValues(linkDoc);
  }
  if (Object.keys(links).length) values.links = links;
  return values;
}
