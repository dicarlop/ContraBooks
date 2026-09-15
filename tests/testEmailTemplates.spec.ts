import test from 'tape';
import {
  createDocumentEmail,
  getDefaultEmailTemplate,
  renderEmailTemplate,
} from 'src/utils/email';

test('email templates: render document context', (t) => {
  const template = getDefaultEmailTemplate('Invoice');
  const rendered = renderEmailTemplate(template, {
    documentType: 'Invoice',
    documentNumber: 'INV-0001',
    customerName: 'Acme Ltd.',
    companyName: 'ContraBooks Demo',
  });

  t.equal(
    rendered.subject,
    'Invoice INV-0001 from ContraBooks Demo',
    'invoice subject should render placeholders'
  );
  t.ok(
    rendered.text.includes('Acme Ltd.'),
    'invoice body should include the customer name'
  );
  t.ok(
    rendered.text.includes('ContraBooks Demo'),
    'invoice body should include the company name'
  );
  t.end();
});

test('email templates: preserve unknown placeholders', (t) => {
  const rendered = renderEmailTemplate(
    { subject: 'Hello {{unknown}}', text: 'Number {{document_number}}' },
    { documentType: 'Quote', documentNumber: 'Q-12' }
  );

  t.equal(rendered.subject, 'Hello {{unknown}}');
  t.equal(rendered.text, 'Number Q-12');
  t.end();
});

test('email message: creates PDF-ready attachment message', (t) => {
  const message = createDocumentEmail(
    {
      documentType: 'Receipt',
      documentNumber: 'REC-0004',
      customerName: 'Customer',
      companyName: 'ContraBooks Demo',
    },
    ['customer@example.com'],
    {
      filename: 'REC-0004.pdf',
      content: new Uint8Array([1, 2, 3]),
      contentType: 'application/pdf',
    }
  );

  t.deepEqual(message.to, ['customer@example.com']);
  t.equal(message.subject, 'Receipt REC-0004 from ContraBooks Demo');
  t.equal(message.attachments?.length, 1);
  t.equal(message.attachments?.[0]?.filename, 'REC-0004.pdf');
  t.end();
});
