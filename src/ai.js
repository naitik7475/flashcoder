const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getCurrentPrompt } = require('./config'); // Import getCurrentPrompt

let genAI;
let model;

/**
 * Initialize the Google Generative AI with the provided config
 * @param {Object} config - Configuration containing API key and model
 */
function initializeAI(config) {
  genAI = new GoogleGenerativeAI(config.apiKey);
  model = genAI.getGenerativeModel({ model: config.model });
  console.log(`Initialized Gemini with model: ${config.model}`);
}

/**
 * Process collected screenshots with Gemini AI
 * @param {Array<string>} screenshots - Array of base64 encoded screenshots
 * @param {BrowserWindow} mainWindow - The main application window
 * @returns {Promise<void>}
 */
async function processScreenshots(screenshots, mainWindow) {
  if (screenshots.length === 0) {
    mainWindow.webContents.send('error', 'No screenshots captured. Use Ctrl+Shift+A or Ctrl+Shift+S to capture.');
    return;
  }

  try {
    mainWindow.webContents.send('processing-status', true);

    const currentPrompt = getCurrentPrompt(); // Get the current prompt
    console.log(`Using prompt: ${currentPrompt.name}`);

    const parts = [
      { text: currentPrompt.content }, // Use the current prompt's content
    ];

    // Add all screenshots to the request
    for (const img of screenshots) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: img
        }
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
        topK: 40
      }
    });

    const response = result.response;
    const fullText = response.text();
    
    mainWindow.webContents.send('analysis-result', fullText);
  } catch (err) {
    console.error("Error in processScreenshots:", err);
    mainWindow.webContents.send('error', `AI processing error: ${err.message}`);
  } finally {
    mainWindow.webContents.send('processing-status', false);
  }
}

module.exports = {
  initializeAI,
  processScreenshots
};
