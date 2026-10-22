const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const smoke = process.argv.includes('--smoke-test');
app.whenReady().then(async () => {
  const win = new BrowserWindow({width: 1100, height: 850, show: !smoke, webPreferences: {nodeIntegration: false, contextIsolation: true, sandbox: true}});
  win.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  win.webContents.on('will-navigate', event => event.preventDefault());
  const timer = smoke && setTimeout(() => app.exit(1), 30000);
  try {
    await win.loadFile(path.join(__dirname, '../dist/index.html'));
    if (smoke) {
      const ok = await win.webContents.executeJavaScript(`(async () => {
        document.querySelector('#start').click();
        for (let i=0;i<100;i++) {
          if(document.querySelector('#overlay').classList.contains('hidden')) return document.querySelector('#sector').textContent === 'SECTOR 01';
          await new Promise(r=>setTimeout(r,100));
        }
        return false;
      })()`);
      clearTimeout(timer);
      app.exit(ok ? 0 : 1);
    }
  } catch (error) { console.error(error); app.exit(1); }
});
app.on('window-all-closed', () => app.quit());
