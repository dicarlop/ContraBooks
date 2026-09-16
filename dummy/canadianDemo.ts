import { Fyo } from 'fyo';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import setupInstance from 'src/setup/setupInstance';
import { getFiscalYear } from 'utils/misc';

export async function setupCanadianDemoInstance(
  dbPath: string,
  fyo: Fyo,
  notifier?: (stage: string, percent: number) => void
) {
  await fyo.purgeCache();
  notifier?.(fyo.t`Setting Up Canadian Demo Company`, -1);

  await setupInstance(
    dbPath,
    {
      logo: null,
      companyName: 'Maple Ridge Business Solutions Inc.',
      country: 'Canada',
      fullname: 'Alex Morgan',
      email: 'alex@mapleridge.ca',
      bankName: 'RBC Business Operating',
      currency: 'CAD',
      fiscalYearStart: getFiscalYear('01-01', true)!.toISOString(),
      fiscalYearEnd: getFiscalYear('01-01', false)!.toISOString(),
      chartOfAccounts: 'Standard Chart of Accounts',
    },
    fyo
  );

  fyo.store.skipTelemetryLogging = true;
  notifier?.(fyo.t`Creating Canadian Customers and Items`, 0.2);

  const customers = [
    ['Northstar Design Studio', 'hello@northstardesign.ca'],
    ['Laurentian Office Supply', 'accounts@laurentianoffice.ca'],
    ['Harbourview Consulting', 'billing@harbourview.ca'],
    ['Prairie Tech Solutions', 'finance@prairietech.ca'],
  ];

  for (const [name, email] of customers) {
    const customer = fyo.doc.getNewDoc(ModelNameEnum.Party, {
      name,
      role: 'Customer',
      email,
      currency: 'CAD',
    });
    await customer.sync();
  }

  const items = [
    ['Business Consulting', 185, 'Service'],
    ['Implementation Services', 325, 'Service'],
    ['Monthly Support', 145, 'Service'],
    ['Training Workshop', 950, 'Service'],
    ['Office Equipment', 780, 'Product'],
  ];

  for (const [name, rate, itemType] of items) {
    const item = fyo.doc.getNewDoc(ModelNameEnum.Item, {
      name,
      for: 'Sales',
      itemType,
      unit: 'Unit',
      incomeAccount: 'Sales',
      expenseAccount: 'Cost of Goods Sold',
    });
    await item.sync();
  }

  const salesItems = items.map(([name, rate]) => ({ name: name as string, rate: rate as number }));
  const customerNames = customers.map(([name]) => name);
  const invoiceDates = [
    DateTime.now().minus({ days: 28 }),
    DateTime.now().minus({ days: 21 }),
    DateTime.now().minus({ days: 14 }),
    DateTime.now().minus({ days: 7 }),
    DateTime.now().minus({ days: 2 }),
  ];

  notifier?.(fyo.t`Creating Canadian Sales Invoices`, 0.45);
  for (let i = 0; i < invoiceDates.length; i++) {
    const invoice = fyo.doc.getNewDoc(
      ModelNameEnum.SalesInvoice,
      { date: invoiceDates[i].toJSDate() },
      false
    );
    await invoice.set('party', customerNames[i % customerNames.length]);
    invoice.account = 'Debtors';

    const item = salesItems[i % salesItems.length];
    await invoice.append('items', {});
    await invoice.items!.at(-1)!.set({
      item: item.name,
      rate: fyo.pesa(item.rate),
      quantity: i % 2 === 0 ? 2 : 1,
      account: 'Sales',
    });
    await invoice.sync();
    await invoice.submit();
  }

  notifier?.(fyo.t`Creating Canadian Purchase Invoices`, 0.7);
  const suppliers = [
    'Maple Office Interiors',
    'Northern IT Services',
  ];
  for (let i = 0; i < suppliers.length; i++) {
    const supplier = fyo.doc.getNewDoc(ModelNameEnum.Party, {
      name: suppliers[i],
      role: 'Supplier',
      email: `accounts@${i === 0 ? 'mapleoffice' : 'northernit'}.ca`,
      currency: 'CAD',
    });
    await supplier.sync();

    const invoice = fyo.doc.getNewDoc(
      ModelNameEnum.PurchaseInvoice,
      { date: DateTime.now().minus({ days: 18 - i * 8 }).toJSDate() },
      false
    );
    await invoice.set('party', suppliers[i]);
    invoice.account = 'Creditors';
    await invoice.append('items', {});
    await invoice.items!.at(-1)!.set({
      item: 'Office Equipment',
      rate: fyo.pesa(650 + i * 225),
      quantity: 1,
      account: 'Cost of Goods Sold',
    });
    await invoice.sync();
    await invoice.submit();
  }

  const address = fyo.doc.getNewDoc(ModelNameEnum.Address);
  await address.setAndSync({
    addressLine1: '250 Saint-Paul Street West',
    city: 'Montreal',
    state: 'Quebec',
    postalCode: 'H2Y 2A2',
    country: 'Canada',
  });

  await fyo.doc.getDoc(ModelNameEnum.PrintSettings).then((printSettings) =>
    printSettings.setAndSync({
      color: '#00AFC1',
      template: 'Business',
      displayLogo: false,
      phone: '+1 514-555-0147',
      address: address.name,
      companyName: 'Maple Ridge Business Solutions Inc.',
      email: 'alex@mapleridge.ca',
    })
  );

  await fyo.singles.SystemSettings?.setAndSync('hideGetStarted', true);
  fyo.store.skipTelemetryLogging = false;
  notifier?.(fyo.t`Canadian Demo Company Ready`, 1);

  return { companyName: 'Maple Ridge Business Solutions Inc.' };
}
