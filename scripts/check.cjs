const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
for (const match of fs.readFileSync('index.html', 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
for (const dir of ['scripts', 'desktop', 'tests']) {
  for (const file of fs.readdirSync(dir).filter(f => /\.(c?js)$/.test(f))) execFileSync(process.execPath, ['--check', `${dir}/${file}`]);
}
for (const file of ['playwright.config.js', 'playwright.smoke.config.js']) execFileSync(process.execPath, ['--check', file]);
console.log('JavaScript syntax checks passed');
