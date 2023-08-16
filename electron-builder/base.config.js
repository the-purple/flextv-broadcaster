const { execSync } = require('child_process');

const base = {
  appId: 'com.flexenm.broadcaster',
  productName: 'FlexTV Broadcaster',
  icon: 'media/images/flextv.ico',
  files: [
    'bundles',
    '!bundles/*.js.map',
    'node_modules',
    'vendor',
    'app/i18n',
    'media/images/game-capture',
    'updater/build/bootstrap.js',
    'updater/build/bundle-updater.js',
    'updater/index.html',
    'index.html',
    'main.js',
    'obs-api',
    'updater/mac/index.html',
    'updater/mac/Updater.js',
  ],
  directories: {
    buildResources: '.',
  },
  nsis: {
    license: 'AGREEMENT',
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    include: 'installer.nsh',
  },
  asarUnpack : ["**/node-libuiohook/**", "**/node-fontinfo/**", "**/font-manager/**", "**/game_overlay/**","**/color-picker/**"],
  publish: {
    provider: 's3',
    region: 'ap-northeast-2',
    bucket: 'flextv-broadcaster',
    acl: 'public-read',
  },
  win: {
    executableName: 'FlexTV Broadcaster',
    extraFiles: ['LICENSE', 'AGREEMENT', 'shared-resources/**/*', '!shared-resources/README'],
    rfc3161TimeStampServer: 'http://timestamp.digicert.com',
    timeStampServer: 'http://timestamp.digicert.com',
    signDlls: true,
    async sign(config) {
      if (config.path.includes('Flex')) {
        execSync(
          'signtool sign /a /v /tr http://timestamp.globalsign.com/tsa/r6advanced1 /td SHA256 /fd sha256 ' +
          `"${config.path}"`,
        );
      }
    },
  },
  mac: {
    extraFiles: [
      'shared-resources/**/*',
      '!shared-resources/README',
      // {
      //   "from": "node_modulesdwadawd/obs-studio-node/Frameworks/*",
      //   "to": "Frameworks/",
      //   "filter": ["**/*"]
      // },
      // {
      //   "from": "node_modules/obs-studio-node/Frameworks/*",
      //   "to": "Resources/app.asar.unpacked/node_modules/",
      //   "filter": ["**/*"]
      // }
    ],
    icon: 'media/images/icon-mac.icns',
    hardenedRuntime: true,
    entitlements: 'electron-builder/entitlements.plist',
    entitlementsInherit: 'electron-builder/entitlements.plist',
    extendInfo: {
      CFBundleURLTypes: [
        {
          CFBundleURLName: 'Streamlabs OBS Link',
          CFBundleURLSchemes: ['slobs'],
        },
      ],
    },
  },
  dmg: {
    background: 'media/images/dmg-bg.png',
    iconSize: 85,
    contents: [
      {
        x: 130,
        y: 208,
      },
      {
        type: 'link',
        path: '/Applications',
        x: 380,
        y: 208,
      },
    ],
  },
  extraMetadata: {
    env: 'production',
    sentryFrontendDSN: process.env.SLD_SENTRY_FRONTEND_DSN,
    sentryBackendClientURL: process.env.SLD_SENTRY_BACKEND_CLIENT_URL,
    sentryBackendClientPreviewURL: process.env.SLD_SENTRY_BACKEND_CLIENT_PREVIEW_URL,
  },
  afterPack: './electron-builder/afterPack.js',
  afterSign: './electron-builder/notarize.js',
};

module.exports = base;
