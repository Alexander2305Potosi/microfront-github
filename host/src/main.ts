(globalThis as any).ngDevMode = (globalThis as any).ngDevMode ?? false;

import { initFederation } from '@angular-architects/native-federation';

const host = window.location.hostname;
const port = window.location.port;

let manifestPath = 'federation.manifest.json';

if (port === '4566' || host.includes('ministack') || host.includes('localstack')) {
  manifestPath = 'federation.manifest.ministack.json';
} else if (host !== 'localhost' && host !== '127.0.0.1') {
  manifestPath = 'federation.manifest.prod.json';
}

initFederation(manifestPath)
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));

