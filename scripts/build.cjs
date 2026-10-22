const fs = require('node:fs');
const { execSync } = require('node:child_process');
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
fs.copyFileSync('index.html', 'dist/index.html');
fs.cpSync('png', 'dist/png', { recursive: true });
fs.writeFileSync('dist/version.json', JSON.stringify({version: require('../package.json').version, commit: execSync('git rev-parse HEAD').toString().trim()}));
