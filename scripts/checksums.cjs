const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = process.argv[2] || 'release';
const files = fs.readdirSync(dir).filter(f => /\.(dmg|deb|exe)$/.test(f)).sort();
if (!files.length) throw new Error('No installers found');
const lines = files.map(f => `${crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')}  ${f}`);
fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
