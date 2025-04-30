const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Expose specific IPC functions for renderer process
  onAnalysisResult: (callback) => ipcRenderer.on('analysis-result', (_, value) => callback(value)),
  onError: (callback) => ipcRenderer.on('error', (_, value) => callback(value)),
  onClearResult: (callback) => ipcRenderer.on('clear-result', () => callback()),
  onProcessingStatus: (callback) => ipcRenderer.on('processing-status', (_, value) => callback(value)),
  onScreenshotAdded: (callback) => ipcRenderer.on('screenshot-added', (_, count) => callback(count)),
  onUpdatePromptName: (callback) => ipcRenderer.on('update-prompt-name', (_, promptName) => callback(promptName)),

  // Methods that trigger main process functions
  toggleMouseEvents: (ignore) => ipcRenderer.invoke('toggle-mouse-events', ignore),
  processScreenshots: () => ipcRenderer.invoke('process-screenshots'),
  reset: () => ipcRenderer.invoke('reset'),
  getScreenshotCount: () => ipcRenderer.invoke('get-screenshot-count'),
  clearLastScreenshot: () => ipcRenderer.invoke('clear-last-screenshot')
});
