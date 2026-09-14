export default {
  appId: 'app.contrabooks.desktop',
  productName: 'ContraBooks',
  directories: {
    app: 'dist_electron/build',
    output: 'dist_electron',
    buildResources: 'build',
  },
  win: {
    artifactName: '${productName}-v${version}-windows-${arch}.${ext}',
    icon: 'build/icon.svg',
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
