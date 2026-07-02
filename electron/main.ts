import { app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import { registerIpcHandlers } from '../backend/api/ipcHandlers';
import { startSensorServer, stopSensorServer } from '../backend/api/sensorServer';

const isDev = !app.isPackaged;

function resolveIcon() {
  const candidates = isDev
    ? [path.join(__dirname, '../../build/icon.png')]
    : [
        path.join(process.resourcesPath, 'icon.png'),
        path.join(__dirname, '../../build/icon.png'),
      ];
  for (const p of candidates) {
    try {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    } catch {
      /* try next */
    }
  }
  return undefined;
}

function createWindow() {
  const icon = resolveIcon();
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#04060e',
    title: 'N.O.V.A.',
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:5175');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  startSensorServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopSensorServer();
  if (process.platform !== 'darwin') app.quit();
});
