const { app, dialog } = require('electron');
const path = require('path');
const { existsSync, readFileSync, writeFileSync } = require('fs');

// Constants
const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_PROMPT = { name: "Default", content: "You are a helpful assistant." };
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

/**
 * Loads configuration from config.json or creates default config if not exists
 * @returns {Promise<Object|null>} The configuration object or null on error
 */
let currentConfig = null; // Cache the loaded config

async function loadConfig() {
  if (currentConfig) {
    return currentConfig; // Return cached config if already loaded
  }
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

    // Validate prompts structure
    if (!config.prompts || !Array.isArray(config.prompts) || config.prompts.length === 0) {
      console.warn("Prompts missing or invalid in config.json, using default prompt.");
      config.prompts = [DEFAULT_PROMPT];
      config.currentPromptIndex = 0;
      // Optionally save the corrected config back
      // writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } else {
      // Ensure currentPromptIndex is valid
      if (typeof config.currentPromptIndex !== 'number' || config.currentPromptIndex < 0 || config.currentPromptIndex >= config.prompts.length) {
        console.warn(`Invalid currentPromptIndex (${config.currentPromptIndex}), resetting to 0.`);
        config.currentPromptIndex = 0;
        // Optionally save the corrected config back
        // writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
      }
    }

    currentConfig = config; // Cache the loaded config
    return currentConfig;
  } catch (err) {
    console.error("Error loading config:", err);
    currentConfig = null; // Clear cache on error
    await dialog.showErrorBox("Configuration Error", `Failed to load configuration: ${err.message}`);
    app.quit();
    return null;
  }
}

/**
 * Saves the current configuration back to config.json
 * @param {Object} configToSave The configuration object to save
 */
function saveConfig(configToSave) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(configToSave, null, 2), 'utf8');
    currentConfig = configToSave; // Update cache
  } catch (err) {
    console.error("Error saving config:", err);
    // Optionally show an error message to the user
    dialog.showErrorBox("Configuration Save Error", `Failed to save configuration: ${err.message}`);
  }
}

/**
 * Gets the currently selected prompt object.
 * Assumes loadConfig has been called successfully.
 * @returns {Object} The current prompt object { name, content }
 */
function getCurrentPrompt() {
  if (!currentConfig || !currentConfig.prompts || currentConfig.prompts.length === 0) {
    console.error("Config not loaded or prompts are missing/empty.");
    return DEFAULT_PROMPT; // Return default as a fallback
  }
  const index = currentConfig.currentPromptIndex || 0;
  return currentConfig.prompts[index] || DEFAULT_PROMPT; // Fallback if index is somehow invalid
}

/**
 * Cycles to the next prompt in the list and saves the updated index.
 * @returns {Object} The new current prompt object { name, content }
 */
function cyclePrompt() {
  if (!currentConfig || !currentConfig.prompts || currentConfig.prompts.length === 0) {
    console.error("Cannot cycle prompt: Config not loaded or prompts are missing/empty.");
    return DEFAULT_PROMPT;
  }

  let nextIndex = (currentConfig.currentPromptIndex + 1) % currentConfig.prompts.length;
  currentConfig.currentPromptIndex = nextIndex;

  // Save the updated index back to the file
  saveConfig(currentConfig);

  console.log(`Cycled to prompt: ${currentConfig.prompts[nextIndex].name} (Index: ${nextIndex})`);
  return currentConfig.prompts[nextIndex];
}


module.exports = {
  loadConfig,
  getCurrentPrompt,
  cyclePrompt,
  DEFAULT_MODEL,
  DEFAULT_PROMPT
};
