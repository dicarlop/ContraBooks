import test from 'tape';
import { buildPaymentReminderPlan } from '../paymentReminderExecutor';
import { getDefaultPaymentReminderSettings } from '../paymentReminders';

test('payment reminder plan includes eligible invoices', (t) => {
  const settings = {
    ...getDefaultPaymentReminderSettings(),
    enabled: true,
  };
  const plan = buildPaymentReminderPlan(
    [
      {
        name: 'INV-001',
        dueDate: '2026-09-16',
        outstandingAmount: 125,
        customerName: 'Acme Ltd.',
        customerEmail: 'billing@example.com',
        companyName: 'ContraBooks Demo',
      },
      {
        name: 'INV-002',
        dueDate: '2026-09-16',
        outstandingAmount: 0,
        customerEmail: 'paid@example.com',
      },
      {
        name: 'INV-003',
        dueDate: '2026-09-16',
        outstandingAmount: 80,
      },
    ],
    settings,
    [],
    new Date('2026-09-16T12:00:00')
  );

  t.equal(plan.length, 1, 'only the unpaid invoice with an email is planned');
  t.equal(plan[0].invoiceName, 'INV-001');
  t.equal(plan[0].recipient, 'billing@example.com');
  t.equal(plan[0].message.subject, 'Payment reminder: INV-001 from ContraBooks Demo');
  t.match(plan[0].message.text, /Amount due: 125\.00/);
  t.end();
});

test('payment reminder plan respects repeat interval', (t) => {
  const settings = {
    ...getDefaultPaymentReminderSettings(),
    enabled: true,
    repeatEveryDays: 7,
  };
  const invoice = {
    name: 'INV-004',
    dueDate: '2026-09-15',
    outstandingAmount: 50,
    customerEmail: 'billing@example.com',
  };

  const recentPlan = buildPaymentReminderPlan(
    [invoice],
    settings,
    [{ documentName: 'INV-004', sentAt: '2026-09-15T09:00:00' }],
    new Date('2026-09-16T12:00:00')
  );
  const repeatPlan = buildPaymentReminderPlan(
    [invoice],
    settings,
    [{ documentName: 'INV-004', sentAt: '2026-09-08T09:00:00' }],
    new Date('2026-09-16T12:00:00')
  );

  t.equal(recentPlan.length, 0, 'recent reminder is suppressed');
  t.equal(repeatPlan.length, 1, 'old reminder is eligible again');
  t.end();
});
