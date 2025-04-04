const { ipcMain } = require('electron');
const { processScreenshots } = require('./ai');

/**
 * Register IPC handlers for renderer communication
 * @param {BrowserWindow} mainWindow - The main application window
 * @param {Array<string>} screenshots - Array of screenshots
 */
function registerIpcHandlers(mainWindow, screenshots) {
  ipcMain.handle('toggle-mouse-events', (event, ignore) => {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  });
  
  ipcMain.handle('process-screenshots', async () => {
    await processScreenshots(screenshots, mainWindow);
  });
  
  ipcMain.handle('reset', () => {
    screenshots.length = 0;
    mainWindow.webContents.send('clear-result');
  });
  
  ipcMain.handle('get-screenshot-count', () => {
    return screenshots.length;
  });
  
  ipcMain.handle('clear-last-screenshot', () => {
    if (screenshots.length > 0) {
      screenshots.pop();
      return screenshots.length;
    }
    return 0;
  });
}

module.exports = {
  registerIpcHandlers
};