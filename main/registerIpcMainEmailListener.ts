import { app, ipcMain } from 'electron';
import databaseManager from '../backend/database/manager';
import type { EmailDocumentType } from '../src/utils/email';
import { IPC_ACTIONS } from '../utils/messages';
import { sendSmtpMessage } from './email';
import { getEmailSettings, getSmtpConfig, setEmailSettings } from './emailSettings';
import { renderHtmlAsPdf } from './saveHtmlAsPdf';

type DocumentEmailMessage = Parameters<typeof sendSmtpMessage>[1] & {
  documentType: EmailDocumentType;
  documentNumber: string;
};

export default function registerIpcMainEmailListener() {
  ipcMain.handle(
    IPC_ACTIONS.SEND_DOCUMENT_EMAIL,
    async (_, message: DocumentEmailMessage) => {
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
  message: DocumentEmailMessage,
  status: 'Sent' | 'Failed',
  error?: string
) {
  try {
    await databaseManager.call('insert', 'EmailLog', {
      documentType: message.documentType,
      documentName: message.documentNumber,
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
