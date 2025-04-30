const { app } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs/promises');

const SCREENSHOTS_DIR = path.join(app.getPath('pictures'), 'oa-coder-screenshots');

/**
 * Captures a screenshot and returns it as base64
 * @param {BrowserWindow} mainWindow - The main application window
 * @returns {Promise<string>} Base64 encoded screenshot
 */
async function captureScreenshot(mainWindow) {
  try {
    // Hide window before capturing
    mainWindow.hide();
    await new Promise(res => setTimeout(res, 200));

    // Ensure screenshots directory exists
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });

    const timestamp = Date.now();
    const imagePath = path.join(SCREENSHOTS_DIR, `screenshot_${timestamp}.png`);
    
    await screenshot({ filename: imagePath });
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    mainWindow.show();
    return base64Image;
  } catch (err) {
    mainWindow.show();
    console.error("Screenshot capture error:", err);
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('error', err.message);
    }
    throw err;
  }
}

module.exports = {
  captureScreenshot
};