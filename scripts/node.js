'use strict';

const settings = require('../settings/local');

async function main () {

}

main().catch((error) => {
  console.error('[NODE]', '[EXCEPTION]', error);
}).then((result) => {
  console.log('[NODE]', '[RESULT]', result);
});
