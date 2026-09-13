import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  appId: 'com.frappe.books',
  productName: 'ContraBooks',
  directories: {
    app: 'dist_electron/build',
    output: 'dist_electron',
    buildResources: 'build',
  },
  win: {
    artifactName: '${productName}-v${version}-windows-${arch}.${ext}',
    icon: 'icon.ico',
    publish: ['github'],
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
      {
        target: 'portable',
        arch: ['x64'],
      },
    ],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
  mac: {
    category: 'public.app-category.finance',
    target: ['dmg', 'zip'],
    icon: 'build/icon.icns',
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Office',
    icon: 'build/icon.png',
  },
};
