const { app, dialog } = require('electron');
const path = require('path');
const { existsSync, readFileSync } = require('fs');

// Constants
const DEFAULT_MODEL = "gemini-2.0-flash";
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

/**
 * Loads configuration from config.json or creates default config if not exists
 * @returns {Promise<Object>} The configuration object
 */
async function loadConfig() {
  try {
    if (!existsSync(CONFIG_PATH)) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Configuration Missing',
        message: 'config.json is missing. Please create it with your API key.',
        detail: `Expected at: ${CONFIG_PATH}`,
        buttons: ['OK']
      });
      app.quit();
      return null;
    }

    const configData = readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);

    if (!config.apiKey) {
      throw new Error("API key is missing in config.json");
    }

    // Set default model if not specified
    if (!config.model) {
      config.model = DEFAULT_MODEL;
      console.log("Model not specified in config, using default:", config.model);
    }

    return config;
  } catch (err) {
    console.error("Error loading config:", err);
    await dialog.showErrorBox("Configuration Error", `Failed to load configuration: ${err.message}`);
    app.quit();
    return null;
  }
}

module.exports = {
  loadConfig,
  DEFAULT_MODEL
};