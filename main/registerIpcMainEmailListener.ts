import { ipcMain } from 'electron';
import { IPC_ACTIONS } from '../utils/messages';
import { sendSmtpMessage } from './email';

export default function registerIpcMainEmailListener() {
  ipcMain.handle(
    IPC_ACTIONS.SEND_DOCUMENT_EMAIL,
    async (
      _,
      config: Parameters<typeof sendSmtpMessage>[0],
      message: Parameters<typeof sendSmtpMessage>[1]
    ) => sendSmtpMessage(config, message)
  );
}
