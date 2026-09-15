import { app, ipcMain } from 'electron';
import databaseManager from '../backend/database/manager';
import { IPC_ACTIONS } from '../utils/messages';
import { sendSmtpMessage } from './email';
import { getEmailSettings, getSmtpConfig, setEmailSettings } from './emailSettings';
import { renderHtmlAsPdf } from './saveHtmlAsPdf';

export default function registerIpcMainEmailListener() {
  ipcMain.handle(
    IPC_ACTIONS.SEND_DOCUMENT_EMAIL,
    async (_, message: Parameters<typeof sendSmtpMessage>[1]) => {
      try {
        await sendSmtpMessage(getSmtpConfig(), message);
        await logEmailAttempt(message, 'Sent');
      } catch (error) {
        await logEmailAttempt(
          message,
          'Failed',
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }
    }
  );

  ipcMain.handle(
    IPC_ACTIONS.CREATE_PDF_FROM_HTML,
    async (_, html: string, width: number, height: number) =>
      renderHtmlAsPdf(html, app, width, height)
  );

  ipcMain.handle(IPC_ACTIONS.GET_EMAIL_SETTINGS, () => getEmailSettings());
  ipcMain.handle(IPC_ACTIONS.SET_EMAIL_SETTINGS, (_, settings) => {
    setEmailSettings(settings);
  });
}

async function logEmailAttempt(
  message: Parameters<typeof sendSmtpMessage>[1],
  status: 'Sent' | 'Failed',
  error?: string
) {
  const attachmentName = message.attachments?.[0]?.filename;
  const documentName = attachmentName?.replace(/\.pdf$/i, '') ?? message.subject;
  const documentType = getDocumentType(message.subject);

  try {
    await databaseManager.call('insert', 'EmailLog', {
      documentType,
      documentName,
      to: message.to.join(', '),
      cc: message.cc?.join(', '),
      bcc: message.bcc?.join(', '),
      subject: message.subject,
      status,
      error,
      sentAt: new Date().toISOString(),
    });
  } catch {
    // Email history must never hide the actual SMTP result.
  }
}

function getDocumentType(subject: string) {
  if (/payment reminder/i.test(subject)) return 'Payment Reminder';
  if (/credit note/i.test(subject)) return 'Credit Note';
  if (/statement/i.test(subject)) return 'Statement';
  if (/quote/i.test(subject)) return 'Quote';
  if (/receipt/i.test(subject)) return 'Receipt';
  return 'Invoice';
}
