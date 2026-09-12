import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  appId: 'com.frappe.books',
  productName: 'ContraBooks',
  directories: {
    output: 'dist_electron',
  },
  files: [
    'books/**/*',
    'fyo/**/*',
    'main/**/*',
    'accounting/**/*',
    'build/**/*',
    'node_modules/**/*',
    'package.json',
  ],
  extraResources: [
    {
      from: 'build/icon.ico',
      to: 'icon.ico',
    },
  ],
  win: {
    publisherName: 'Frappe Technologies Pvt. Ltd.',
    artifactName: '${productName}-v${version}-windows-${arch}.${ext}',
    signDlls: true,
    icon: 'build/icon.ico',
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
