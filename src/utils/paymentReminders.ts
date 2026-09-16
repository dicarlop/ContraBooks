export interface PaymentReminderSettings {
  enabled: boolean;
  daysBeforeDue: number;
  daysAfterDue: number;
  repeatEveryDays: number;
}

export interface PaymentReminderInvoice {
  name: string;
  dueDate?: string | Date;
  outstandingAmount?: { float: number } | number;
}

export interface PaymentReminderLog {
  documentName: string;
  sentAt: string | Date;
}

export function getDefaultPaymentReminderSettings(): PaymentReminderSettings {
  return {
    enabled: false,
    daysBeforeDue: 3,
    daysAfterDue: 1,
    repeatEveryDays: 7,
  };
}

export function isPaymentReminderDue(
  invoice: PaymentReminderInvoice,
  settings: PaymentReminderSettings,
  now = new Date(),
  logs: PaymentReminderLog[] = []
): boolean {
  if (!settings.enabled || !invoice.dueDate || getOutstandingAmount(invoice) <= 0) {
    return false;
  }

  const dueDate = startOfDay(new Date(invoice.dueDate));
  const today = startOfDay(now);
  const daysFromDue = Math.round(
    (today.getTime() - dueDate.getTime()) / 86400000
  );

  const inReminderWindow =
    daysFromDue >= -settings.daysBeforeDue &&
    daysFromDue <= settings.daysAfterDue;

  if (!inReminderWindow) {
    return false;
  }

  const lastReminder = logs
    .filter(({ documentName }) => documentName === invoice.name)
    .map(({ sentAt }) => new Date(sentAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!lastReminder) {
    return true;
  }

  const daysSinceLastReminder =
    (today.getTime() - startOfDay(lastReminder).getTime()) / 86400000;

  return daysSinceLastReminder >= settings.repeatEveryDays;
}

export function getOutstandingAmount(invoice: PaymentReminderInvoice): number {
  return typeof invoice.outstandingAmount === 'number'
    ? invoice.outstandingAmount
    : invoice.outstandingAmount?.float ?? 0;
}

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}
