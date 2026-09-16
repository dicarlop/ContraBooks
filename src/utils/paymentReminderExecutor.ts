import {
  createDocumentEmail,
  EmailMessage,
} from './email';
import {
  getOutstandingAmount,
  isPaymentReminderDue,
  PaymentReminderInvoice,
  PaymentReminderLog,
  PaymentReminderSettings,
} from './paymentReminders';

export interface PaymentReminderCandidate extends PaymentReminderInvoice {
  customerName?: string;
  customerEmail?: string;
  companyName?: string;
  amountDue?: string;
  dueDateLabel?: string;
}

export interface PaymentReminderPlanItem {
  invoiceName: string;
  recipient: string;
  message: EmailMessage;
}

/**
 * Builds reminders that are eligible to be sent.
 *
 * This function deliberately does not send mail or write EmailLog records.
 * A transport can consume the returned plan once an outbound mail provider
 * is configured, without marking an unsent reminder as delivered.
 */
export function buildPaymentReminderPlan(
  invoices: PaymentReminderCandidate[],
  settings: PaymentReminderSettings,
  logs: PaymentReminderLog[] = [],
  now = new Date()
): PaymentReminderPlanItem[] {
  return invoices
    .filter((invoice) => invoice.customerEmail?.trim())
    .filter((invoice) =>
      isPaymentReminderDue(invoice, settings, now, logs)
    )
    .map((invoice) => ({
      invoiceName: invoice.name,
      recipient: invoice.customerEmail!.trim(),
      message: createDocumentEmail(
        {
          documentType: 'Payment Reminder',
          documentNumber: invoice.name,
          customerName: invoice.customerName,
          companyName: invoice.companyName,
          amountDue:
            invoice.amountDue ?? formatAmount(getOutstandingAmount(invoice)),
          dueDate: invoice.dueDateLabel ?? formatDate(invoice.dueDate),
        },
        [invoice.customerEmail!.trim()]
      ),
    }));
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatDate(value?: string | Date): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString();
}
