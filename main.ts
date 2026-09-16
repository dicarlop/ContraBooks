// eslint-disable-next-line
require('source-map-support').install({
  handleUncaughtException: false,
  environment: 'node',
});

import { emitMainProcessError } from 'backend/helpers';
import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import autoUpdater from 'electron-updater';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import registerAppLifecycleListeners from './main/registerAppLifecycleListeners';
import registerAutoUpdaterListeners from './main/registerAutoUpdaterListeners';
import registerIpcMainActionListeners from './main/registerIpcMainActionListeners';
import registerIpcMainEmailListener from './main/registerIpcMainEmailListener';
import registerIpcMainMessageListeners from './main/registerIpcMainMessageListeners';
import registerProcessListeners from './main/registerProcessListeners';

const WINDOWS_CB_ICON = 'AAABAAEAEBAAAAAAIAAuAQAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAAQAAAAEAgGAAAAH/P/YQAAAPVJREFUeJxjZNP2+s9AAWCi';

export class Main {
  title = 'ContraBooks';
  icon: string;
  winURL = '';
  checkedForUpdate = false;
  mainWindow: BrowserWindow | null = null;
  WIDTH = 1200;
  HEIGHT = process.platform === 'win32' ? 826 : 800;

  constructor() {
    this.icon = this.getWindowIcon();
    if (this.isDevelopment) autoUpdater.logger = console;
    app.commandLine.appendSwitch('disable-http2');
    autoUpdater.requestHeaders = {'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'};
    this.registerListeners();
    if (this.isMac && this.isDevelopment) app.dock?.setIcon(this.icon);
  }
  get isDevelopment(){return process.env.NODE_ENV==='development';}
  get isTest(){return !!process.env.IS_TEST;}
  get isMac(){return process.platform==='darwin';}
  get isLinux(){return process.platform==='linux';}
  get isWindows(){return process.platform==='win32';}
  getWindowIcon(){
    if (this.isLinux) return path.join(__dirname,'icons','512x512.png');
    if (this.isMac && this.isDevelopment) return path.resolve('./build/icon.png');
    const iconPath = path.join(app.getPath('userData'),'contrabooks-cb.ico');
    try { if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, Buffer.from(WINDOWS_CB_ICON,'base64')); } catch (err) { emitMainProcessError(err); }
    return iconPath;
  }
  registerListeners(){registerIpcMainMessageListeners(this);registerIpcMainActionListeners(this);registerIpcMainEmailListener();registerAutoUpdaterListeners(this);registerAppLifecycleListeners(this);registerProcessListeners(this);}
  getOptions():BrowserWindowConstructorOptions{const preload=path.join(__dirname,'main','preload.js');return{width:this.WIDTH,height:this.HEIGHT,minWidth:960,minHeight:640,title:this.title,titleBarStyle:'hidden',trafficLightPosition:{x:16,y:16},webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:false,preload},autoHideMenuBar:true,frame:!this.isMac,resizable:true,icon:this.icon};}
  async createWindow(){const options=this.getOptions();this.mainWindow=new BrowserWindow(options);this.setMainWindowListeners();if(this.isDevelopment)this.setViteServerURL();else this.setPackagedFileURL();try{await this.mainWindow.loadURL(this.winURL);}catch(err){emitMainProcessError(err);throw err;}if(this.isDevelopment&&!this.isTest)this.mainWindow.webContents.openDevTools();}
  setViteServerURL(){let port=6969;let host='0.0.0.0';if(process.env.VITE_PORT&&process.env.VITE_HOST){port=Number(process.env.VITE_PORT);host=process.env.VITE_HOST;}this.winURL=`http://${host}:${port}/`;}
  setPackagedFileURL(){const indexPath=path.join(__dirname,'src','index.html');this.winURL=pathToFileURL(indexPath).toString();if(this.isTest){try{fs.accessSync(indexPath,fs.constants.R_OK);}catch(err){emitMainProcessError(err);throw err;}}}
  setMainWindowListeners(){if(this.mainWindow===null)return;this.mainWindow.on('closed',()=>{this.mainWindow=null;});}
}
export default new Main();