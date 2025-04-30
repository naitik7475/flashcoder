const { app, BrowserWindow } = require('electron');
const path = require('path');

/**
 * Creates the main application window
 * @returns {BrowserWindow} The created window
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js')
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    paintWhenInitiallyHidden: true,
    contentProtection: true,
    type: 'panel',
    focusable: false,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    enableLargerThanScreen: true,
    thickFrame: false,
    autoHideMenuBar: true,
    minimizable: false,
    closable: false,
    movable: false,
  });

  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true
  });
  
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setContentProtection(true);
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Hide from App Switcher and Dock on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  
  return mainWindow;
}

module.exports = {
  createWindow
};