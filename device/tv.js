// Download `playIrMagicianLocal.py` from
// http://www.omiya-giken.com/?page_id=1231

'use strict';

exports.id = 'tv';

exports.handle = () => {
  require('child_process').execSync('./playIrMagicianLocal.py tv-power.json');
};
