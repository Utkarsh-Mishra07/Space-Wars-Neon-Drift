const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function find(dir, name) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if(e.isFile() && e.name===name) return p;
    if(e.isDirectory()){const found=find(p,name);if(found)return found;}
  }
}
const name = process.platform==='win32' ? 'Neon Drift.exe' : process.platform==='darwin' ? 'Neon Drift' : 'space-wars';
const executable = find('release',name);
if(!executable) throw new Error(`Packaged executable ${name} missing`);
const result = spawnSync(path.resolve(executable), ['--smoke-test', ...(process.platform==='linux'?['--no-sandbox']:[])], {stdio:'inherit',timeout:45000});
if(result.error) console.error(result.error);
process.exit(result.status===0?0:1);
