const baseConfig = require('./base.config');

module.exports = {
  ...baseConfig,
  publish: {
    provider: 's3',
    region: 'ap-northeast-2',
    bucket: 'flextv-broadcaster-production',
    acl: 'public-read',
  },
};
