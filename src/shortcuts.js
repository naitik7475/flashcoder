const { globalShortcut } = require('electron');
const { captureScreenshot } = require('./screenshot');
const { processScreenshots } = require('./ai');

// Constants
const MOVE_STEP = 20;

/**
 * Register all global keyboard shortcuts
 * @param {BrowserWindow} mainWindow - The main application window
 * @param {Array<string>} screenshots - Array to store screenshots
 * @param {Object} state - Application state object
 */
function registerShortcuts(mainWindow, screenshots, state) {
  // Window movement shortcuts
  globalShortcut.register('Control+Left', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x - MOVE_STEP, y);
  });

  globalShortcut.register('Control+Right', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + MOVE_STEP, y);
  });

  globalShortcut.register('Control+Up', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y - MOVE_STEP);
  });

  globalShortcut.register('Control+Down', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + MOVE_STEP);
  });

  // Ctrl+S => single or final screenshot
  globalShortcut.register('Control+S', async () => {
    try {
      const img = await captureScreenshot(mainWindow);
      screenshots.push(img);
      await processScreenshots(screenshots, mainWindow);
    } catch (error) {
      console.error("Ctrl+S error:", error);
    }
  });

  // Ctrl+A => multi-page mode
  globalShortcut.register('Control+A', async () => {
    try {
      if (!state.multiPageMode) {
        state.multiPageMode = true;
      }
      const img = await captureScreenshot(mainWindow);
      screenshots.push(img);
      mainWindow.webContents.send('screenshot-added', screenshots.length);
    } catch (error) {
      console.error("Ctrl+A error:", error);
    }
  });

  // Ctrl+D => process multi-page screenshots
  globalShortcut.register('Control+D', async () => {
    if (state.multiPageMode && screenshots.length > 0) {
      await processScreenshots(screenshots, mainWindow);
    }
  });

  // Ctrl+R => reset
  globalShortcut.register('Control+R', () => {
    screenshots.length = 0;
    state.multiPageMode = false;
    mainWindow.webContents.send('clear-result');
  });

  // Ctrl+H => toggle window visibility
  globalShortcut.register('Control+H', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  // Quit shortcut removed
}

module.exports = {
  registerShortcuts
};