const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
const config = withNativeFederation({
  name: 'mf-complex',
  exposes: {
    './ComplexDemo': { file: './mf-complex/src/app/complex-demo/complex-demo.component.ts' },
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],
  features: { ignoreUnusedDeps: true }
});
config.sharedMappingsConfig = config.sharedMappingsConfig || {};
module.exports = config;
