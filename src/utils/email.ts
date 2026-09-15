export type EmailDocumentType =
  | 'Invoice'
  | 'Quote'
  | 'Receipt'
  | 'Payment Reminder'
  | 'Statement'
  | 'Credit Note';

export interface EmailAttachment {
  filename: string;
  content: Uint8Array;
  contentType?: string;
}

export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface DocumentEmailContext {
  documentType: EmailDocumentType;
  documentNumber: string;
  customerName?: string;
  companyName?: string;
  amountDue?: string;
  dueDate?: string;
}

export interface EmailTemplate {
  subject: string;
  text: string;
}

const DEFAULT_TEMPLATES: Record<EmailDocumentType, EmailTemplate> = {
  Invoice: {
    subject: '{{document_type}} {{document_number}} from {{company_name}}',
    text: 'Hello {{customer_name}},\n\nPlease find your invoice attached.\n\nThank you,\n{{company_name}}',
  },
  Quote: {
    subject: '{{document_type}} {{document_number}} from {{company_name}}',
    text: 'Hello {{customer_name}},\n\nPlease find your quote attached.\n\nThank you,\n{{company_name}}',
  },
  Receipt: {
    subject: '{{document_type}} {{document_number}} from {{company_name}}',
    text: 'Hello {{customer_name}},\n\nPlease find your receipt attached.\n\nThank you,\n{{company_name}}',
  },
  'Payment Reminder': {
    subject: 'Payment reminder: {{document_number}} from {{company_name}}',
    text: 'Hello {{customer_name}},\n\nThis is a reminder that payment is due for {{document_number}}.\n\nAmount due: {{amount_due}}\nDue date: {{due_date}}\n\nThank you,\n{{company_name}}',
  },
  Statement: {
    subject: 'Statement {{document_number}} from {{company_name}}',
    text: 'Hello {{customer_name}},\n\nPlease find your statement attached.\n\nThank you,\n{{company_name}}',
  },
  'Credit Note': {
    subject: '{{document_type}} {{document_number}} from {{company_name}}',
    text: 'Hello {{customer_name}},\n\nPlease find your credit note attached.\n\nThank you,\n{{company_name}}',
  },
};

export function getDefaultEmailTemplate(
  documentType: EmailDocumentType
): EmailTemplate {
  return { ...DEFAULT_TEMPLATES[documentType] };
}

export function renderEmailTemplate(
  template: EmailTemplate,
  context: DocumentEmailContext
): EmailTemplate {
  const values: Record<string, string> = {
    document_type: context.documentType,
    document_number: context.documentNumber,
    customer_name: context.customerName ?? 'Customer',
    company_name: context.companyName ?? 'Your Company',
    amount_due: context.amountDue ?? '',
    due_date: context.dueDate ?? '',
  };

  const render = (value: string) =>
    value.replace(/{{\s*([a-z_]+)\s*}}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
    );

  return {
    subject: render(template.subject),
    text: render(template.text),
  };
}

export function createDocumentEmail(
  context: DocumentEmailContext,
  to: string[],
  attachment?: EmailAttachment
): EmailMessage {
  const template = renderEmailTemplate(
    getDefaultEmailTemplate(context.documentType),
    context
  );

  return {
    to,
    subject: template.subject,
    text: template.text,
    attachments: attachment ? [attachment] : [],
  };
}
