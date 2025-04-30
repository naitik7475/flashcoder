const { app, BrowserWindow, globalShortcut } = require('electron');

// Import modules
const { loadConfig } = require('./src/config');
const { initializeAI } = require('./src/ai');
const { createWindow } = require('./src/window');
const { registerShortcuts } = require('./src/shortcuts');
const { registerIpcHandlers } = require('./src/ipc');

// Application state
let mainWindow;
const screenshots = [];
const state = {
  multiPageMode: false
};

// App initialization
app.whenReady().then(async () => {
  // Set performance optimizations
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  
  // Load configuration
  const config = await loadConfig();
  if (config) {
    initializeAI(config);
    mainWindow = createWindow();
    registerShortcuts(mainWindow, screenshots, state);
    registerIpcHandlers(mainWindow, screenshots);
  }
  
  // Prevent the app from showing in the dock/taskbar when relaunched
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Clean up when app is closing
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// In main.js, after registering shortcuts:
const { cyclePrompt, getCurrentPrompt } = require('./src/config');

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
    registerShortcuts(mainWindow, screenshots, state);
    registerIpcHandlers(mainWindow, screenshots);
  }

  // Initialize the prompt name in the UI
  const currentPrompt = getCurrentPrompt();
  mainWindow.webContents.send('update-prompt-name', currentPrompt.name);
});
