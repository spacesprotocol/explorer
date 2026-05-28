import '$lib/request-validation';

import pkg from '../../package.json';

export function load() {
  return {
    appVersion: pkg.version
  };
}
