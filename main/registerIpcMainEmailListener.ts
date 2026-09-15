import { ipcMain } from 'electron';
import { IPC_ACTIONS } from '../utils/messages';
import { sendSmtpMessage } from './email';
import { getEmailSettings, getSmtpConfig, setEmailSettings } from './emailSettings';

export default function registerIpcMainEmailListener() {
  ipcMain.handle(
    IPC_ACTIONS.SEND_DOCUMENT_EMAIL,
    async (_, message: Parameters<typeof sendSmtpMessage>[1]) =>
      sendSmtpMessage(getSmtpConfig(), message)
  );

  ipcMain.handle(IPC_ACTIONS.GET_EMAIL_SETTINGS, () => getEmailSettings());
  ipcMain.handle(IPC_ACTIONS.SET_EMAIL_SETTINGS, (_, settings) => {
    setEmailSettings(settings);
  });
}
