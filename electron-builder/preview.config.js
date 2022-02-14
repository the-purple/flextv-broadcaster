const base = require('./base.config');

base.appId = 'com.streamlabs.slobspreview';
base.productName = 'FlexTV Broadcaster Preview';
base.extraMetadata.name = 'slobs-client-preview';
base.win.extraFiles.push({
  from: 'scripts/debug-launcher.bat',
  to: 'Streamlabs Desktop Preview Debug Mode.bat',
});
base.win.executableName = 'FlexTV Broadcaster Preview';

module.exports = base;
