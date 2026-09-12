const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

const config = withNativeFederation({
  name: 'remote',
  exposes: {
    './GithubProfiles': { file: './remote/src/app/github-profiles/github-profiles.component.ts' },
    './GithubUsers': { file: './remote/src/app/github-users/github-users.component.ts' },
    './GithubRepos': { file: './remote/src/app/github-repos/github-repos.component.ts' },
    './ComplexDemo': { file: './remote/src/app/complex-demo/complex-demo.component.ts' },
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],
  features: {
    ignoreUnusedDeps: true
  }
});

config.sharedMappingsConfig = config.sharedMappingsConfig || {};
module.exports = config;
