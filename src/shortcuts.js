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
  globalShortcut.register('Control+Shift+Left', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x - MOVE_STEP, y);
  });

  globalShortcut.register('Control+Shift+Right', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + MOVE_STEP, y);
  });

  globalShortcut.register('Control+Shift+Up', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y - MOVE_STEP);
  });

  globalShortcut.register('Control+Shift+Down', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + MOVE_STEP);
  });

  // Ctrl+S => single or final screenshot
  globalShortcut.register('Control+Shift+S', async () => {
    try {
      const img = await captureScreenshot(mainWindow);
      screenshots.push(img);
      await processScreenshots(screenshots, mainWindow);
      mainWindow.setIgnoreMouseEvents(false);
    } catch (error) {
      console.error("Ctrl+S error:", error);
    }
  });

  // Ctrl+A => multi-page mode
  globalShortcut.register('Control+Shift+A', async () => {
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
  globalShortcut.register('Control+Shift+D', async () => {
    if (state.multiPageMode && screenshots.length > 0) {
      await processScreenshots(screenshots, mainWindow);
      mainWindow.setIgnoreMouseEvents(false);
    }
  });

  // Ctrl+R => reset
  globalShortcut.register('Control+Shift+R', () => {
    screenshots.length = 0;
    state.multiPageMode = false;
    mainWindow.webContents.send('clear-result');
    // Make window click-through after reset
    mainWindow.setIgnoreMouseEvents(true);
  });

  // Ctrl+H => toggle window visibility
  globalShortcut.register('Control+Shift+H', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      // Restore mouse interactivity when showing UI again
      mainWindow.setIgnoreMouseEvents(false);
    }
  });

  // Ctrl+Shift+Q => cycle prompt
  globalShortcut.register('Control+Shift+Q', () => {
    const { cyclePrompt } = require('./config');
    const { getCurrentPrompt } = require('./config');
    const newPrompt = cyclePrompt();
    mainWindow.webContents.send('update-prompt-name', getCurrentPrompt().name);
    console.log(`Current prompt: ${getCurrentPrompt().name}`);
  });
}

module.exports = {
  registerShortcuts
};
