import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from 'electron';
import { contextBridge, ipcRenderer } from 'electron';
import type { ConfigMap } from 'fyo/core/types';
import config from 'utils/config';
import type { DatabaseMethod } from 'utils/db/types';
import type { BackendResponse } from 'utils/ipc/types';
import { IPC_ACTIONS, IPC_CHANNELS, IPC_MESSAGES } from 'utils/messages';
import type {
  ConfigFilesWithModified,
  Creds,
  LanguageMap,
  SelectFileOptions,
  SelectFileReturn,
  TemplateFile,
} from 'utils/types';

type IPCRendererListener = Parameters<typeof ipcRenderer.on>[1];
const ipc = {
  desktop: true,
  reloadWindow() { return ipcRenderer.send(IPC_MESSAGES.RELOAD_WINDOW); },
  minimizeWindow() { return ipcRenderer.send(IPC_MESSAGES.MINIMIZE_WINDOW); },
  toggleMaximize() { return ipcRenderer.send(IPC_MESSAGES.MAXIMIZE_MAIN_WINDOW); },
  isMaximized() { return new Promise((resolve) => { ipcRenderer.send(IPC_MESSAGES.ISMAXIMIZED_MAIN_WINDOW); ipcRenderer.once(IPC_MESSAGES.ISMAXIMIZED_RESULT, (_event, value) => resolve(value)); }); },
  isFullscreen() { return new Promise((resolve) => { ipcRenderer.send(IPC_MESSAGES.ISFULLSCREEN_MAIN_WINDOW); ipcRenderer.once(IPC_MESSAGES.ISFULLSCREEN_RESULT, (_event, value) => resolve(value)); }); },
  closeWindow() { return ipcRenderer.send(IPC_MESSAGES.CLOSE_MAIN_WINDOW); },
  async getCreds() { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_CREDS)) as Creds; },
  async getLanguageMap(code: string) { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_LANGUAGE_MAP, code)) as { languageMap: LanguageMap; success: boolean; message: string }; },
  async getTemplates(posTemplateWidth?: number): Promise<TemplateFile[]> { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_TEMPLATES, posTemplateWidth)) as TemplateFile[]; },
  async initScheduler(time: string) { await ipcRenderer.invoke(IPC_ACTIONS.INIT_SHEDULER, time); },
  async selectFile(options: SelectFileOptions): Promise<SelectFileReturn> { return (await ipcRenderer.invoke(IPC_ACTIONS.SELECT_FILE, options)) as SelectFileReturn; },
  async getSaveFilePath(options: SaveDialogOptions) { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_SAVE_FILEPATH, options)) as SaveDialogReturnValue; },
  async getOpenFilePath(options: OpenDialogOptions) { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_OPEN_FILEPATH, options)) as OpenDialogReturnValue; },
  async checkDbAccess(filePath: string) { return (await ipcRenderer.invoke(IPC_ACTIONS.CHECK_DB_ACCESS, filePath)) as boolean; },
  async checkForUpdates() { await ipcRenderer.invoke(IPC_ACTIONS.CHECK_FOR_UPDATES); },
  openLink(link: string) { ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, link); },
  async deleteFile(filePath: string) { return (await ipcRenderer.invoke(IPC_ACTIONS.DELETE_FILE, filePath)) as BackendResponse; },
  async saveData(data: string, savePath: string) { await ipcRenderer.invoke(IPC_ACTIONS.SAVE_DATA, data, savePath); },
  showItemInFolder(filePath: string) { ipcRenderer.send(IPC_MESSAGES.SHOW_ITEM_IN_FOLDER, filePath); },
  async makePDF(html: string, savePath: string, width: number, height: number): Promise<boolean> { return (await ipcRenderer.invoke(IPC_ACTIONS.SAVE_HTML_AS_PDF, html, savePath, width, height)) as boolean; },
  async createPDFFromHTML(html: string, width: number, height: number): Promise<Uint8Array> { return (await ipcRenderer.invoke(IPC_ACTIONS.CREATE_PDF_FROM_HTML, html, width, height)) as Uint8Array; },
  async printDocument(html: string, width: number, height: number): Promise<boolean> { return (await ipcRenderer.invoke(IPC_ACTIONS.PRINT_HTML_DOCUMENT, html, width, height)) as boolean; },
  async getDbList() { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_DB_LIST)) as ConfigFilesWithModified[]; },
  async getDbDefaultPath(companyName: string) { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_DB_DEFAULT_PATH, companyName)) as string; },
  async getEnv() { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_ENV)) as { isDevelopment: boolean; platform: string; version: string }; },
  openExternalUrl(url: string) { ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, url); },
  async showError(title: string, content: string) { await ipcRenderer.invoke(IPC_ACTIONS.SHOW_ERROR, { title, content }); },
  async sendError(body: string) { await ipcRenderer.invoke(IPC_ACTIONS.SEND_ERROR, body); },
  async sendAPIRequest(endpoint: string, options: RequestInit | undefined) { return (await ipcRenderer.invoke(IPC_ACTIONS.SEND_API_REQUEST, endpoint, options)) as Promise<{ [key: string]: string | number | boolean | Date | object | object[] }[]>; },
  async sendDocumentEmail(message: { documentType: 'Invoice' | 'Quote' | 'Receipt' | 'Payment Reminder' | 'Statement' | 'Credit Note'; documentNumber: string; to: string[]; cc?: string[]; bcc?: string[]; subject: string; text: string; attachments?: { filename: string; content: Uint8Array; contentType?: string }[] }) { await ipcRenderer.invoke(IPC_ACTIONS.SEND_DOCUMENT_EMAIL, message); },
  async getEmailSettings() { return (await ipcRenderer.invoke(IPC_ACTIONS.GET_EMAIL_SETTINGS)) as { host: string; port: number; secure: boolean; username: string; from: string; passwordSet: boolean }; },
  async setEmailSettings(settings: { host: string; port: number; secure: boolean; username: string; password: string; from: string }) { await ipcRenderer.invoke(IPC_ACTIONS.SET_EMAIL_SETTINGS, settings); },
  registerMainProcessErrorListener(listener: IPCRendererListener) { ipcRenderer.on(IPC_CHANNELS.LOG_MAIN_PROCESS_ERROR, listener); },
  registerTriggerFrontendActionListener(listener: IPCRendererListener) { ipcRenderer.on(IPC_CHANNELS.TRIGGER_ERPNEXT_SYNC, listener); },
  registerConsoleLogListener(listener: IPCRendererListener) { ipcRenderer.on(IPC_CHANNELS.CONSOLE_LOG, listener); },
  db: {
    async getSchema() { return (await ipcRenderer.invoke(IPC_ACTIONS.DB_SCHEMA)) as BackendResponse; },
    async create(dbPath: string, countryCode?: string, unlockKey?: string) { return (await ipcRenderer.invoke(IPC_ACTIONS.DB_CREATE, dbPath, countryCode, unlockKey)) as BackendResponse; },
    async connect(dbPath: string, countryCode?: string, unlockKey?: string) { return (await ipcRenderer.invoke(IPC_ACTIONS.DB_CONNECT, dbPath, countryCode, unlockKey)) as BackendResponse; },
    async call(method: DatabaseMethod, ...args: unknown[]) { return (await ipcRenderer.invoke(IPC_ACTIONS.DB_CALL, method, ...args)) as BackendResponse; },
    async bespoke(method: string, ...args: unknown[]) { return (await ipcRenderer.invoke(IPC_ACTIONS.DB_BESPOKE, method, ...args)) as BackendResponse; },
  },
  store: {
    get<K extends keyof ConfigMap>(key: K) { return config.get(key); },
    set<K extends keyof ConfigMap>(key: K, value: ConfigMap[K]) { return config.set(key, value); },
    delete(key: keyof ConfigMap) { return config.delete(key); },
  },
} as const;

contextBridge.exposeInMainWorld('ipc', ipc);
export type IPC = typeof ipc;
