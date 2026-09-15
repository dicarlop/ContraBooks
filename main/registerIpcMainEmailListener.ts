import { ipcMain } from 'electron';
import { IPC_ACTIONS } from '../utils/messages';
import { sendSmtpMessage } from './email';
import { getEmailSettings, setEmailSettings } from './emailSettings';

export default function registerIpcMainEmailListener() {
  ipcMain.handle(
    IPC_ACTIONS.SEND_DOCUMENT_EMAIL,
    async (
      _,
      config: Parameters<typeof sendSmtpMessage>[0],
      message: Parameters<typeof sendSmtpMessage>[1]
    ) => sendSmtpMessage(config, message)
  );

  ipcMain.handle(IPC_ACTIONS.GET_EMAIL_SETTINGS, () => getEmailSettings());
  ipcMain.handle(IPC_ACTIONS.SET_EMAIL_SETTINGS, (_, settings) => {
    setEmailSettings(settings);
  });
}
