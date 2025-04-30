document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const responseOverlay = document.getElementById('response-overlay');
  const responseBox = document.getElementById('response-box');
  const statusMessage = document.getElementById('status-message');
  const statusText = document.getElementById('status-text');
  const statusIcon = document.getElementById('status-icon');
  // NOTE: doneBtn and processBtn elements still exist but are hidden.
  //       The JS code referencing them will still run but the buttons
  //       will not be visible or clickable by the user.
  const doneBtn = document.getElementById('done-btn');
  const processBtn = document.getElementById('process-btn');

  // State
  let screenshotCount = 0;
  let isProcessing = false;

  // Mouse event handlers
  const setupMouseEvents = () => {
    // Remove all mouse event handlers to ensure no mouse interactions
    // with the overlay or response box
    
    // Keep the response box interactive for scrolling and copying code
    responseBox.addEventListener('mouseenter', () => {
      window.electronAPI.toggleMouseEvents(false);
    });
    
    responseBox.addEventListener('mouseleave', () => {
      window.electronAPI.toggleMouseEvents(true);
    });
  };

  // Function to update the prompt name in the UI
  const updatePromptName = (promptName) => {
    const promptNameElement = document.getElementById('current-prompt-name');
    if (promptNameElement) {
      promptNameElement.textContent = promptName;
    }
  };

  // Markdown parsing with code highlighting
  const renderMarkdown = (text) => {
    const html = marked.parse(text);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.querySelectorAll('pre').forEach(pre => {
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.textContent = 'Copy';
      copyButton.addEventListener('click', () => {
        const code = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(code).then(() => {
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy';
          }, 2000);
        });
      });
      pre.appendChild(copyButton);
    });
    return tempDiv.innerHTML;
  };

  // Show status message
  const showStatus = (message, type = 'info', duration = 3000) => {
    statusText.textContent = message;
    if (type === 'processing') {
      statusIcon.innerHTML = '<div class="loading-indicator"></div>';
    } else {
      statusIcon.innerHTML = '';
    }
    statusMessage.className = 'status-message visible';
    if (type) {
      statusMessage.classList.add(type);
    }
    if (duration) {
      setTimeout(() => {
        statusMessage.classList.remove('visible');
      }, duration);
    }
    return {
      hide: () => {
        statusMessage.classList.remove('visible');
      }
    };
  };

  // Add shortcuts info
   const addShortcutsInfo = () => {
     const shortcutsInfo = document.createElement('div');
     shortcutsInfo.className = 'shortcuts-info';
     shortcutsInfo.innerHTML = `
       <h3>Keyboard Shortcuts</h3>
       <ul>
         <li><span class="keyboard-shortcut">Ctrl+A</span> - Add a screenshot to multi-page capture</li>
         <li><span class="keyboard-shortcut">Ctrl+S</span> - Capture single screenshot & process</li>
         <li><span class="keyboard-shortcut">Ctrl+D</span> - Process multi-page screenshots</li>
         <li><span class="keyboard-shortcut">Ctrl+R</span> - Reset/clear all screenshots</li>
         <li><span class="keyboard-shortcut">Ctrl+H</span> - Hide/show window</li>
         <li><span class="keyboard-shortcut">Ctrl+↑/↓/←/→</span> - Move window</li>
         <li><span class="keyboard-shortcut">Esc</span> - Close this response view</li>
       </ul>
     `;
   
     responseBox.appendChild(shortcutsInfo);
   };

    // Setup event listeners
    const setupEventListeners = () => {
      // IPC event handlers
      window.electronAPI.onAnalysisResult(result => {
        responseBox.innerHTML = renderMarkdown(result);
        showOverlay();
        isProcessing = false;
      });

      window.electronAPI.onUpdatePromptName(promptName => {
        //updatePromptName(promptName);
        showStatus(`Current Prompt: ${promptName}`, 'info', 2000);
      });

    window.electronAPI.onError(error => {
      responseBox.innerHTML = `
        <div class="error-message">
          <strong>Error:</strong> ${error}
        </div>
      `;
      showOverlay();
      isProcessing = false;
    });

    window.electronAPI.onClearResult(() => {
      responseBox.innerHTML = "";
      hideOverlay();
      isProcessing = false;
    });

    window.electronAPI.onProcessingStatus(status => {
      isProcessing = status;
      if (status) {
        showStatus('Processing screenshots with AI...', 'processing', 0);
      } else {
        // Ensure status message hides if processing finishes
         const currentStatus = document.querySelector('#status-message.processing');
         if (currentStatus) {
           currentStatus.classList.remove('visible');
         }
      }
    });

    window.electronAPI.onScreenshotAdded(count => {
      screenshotCount = count;
      showStatus(`Screenshot ${count} captured`, 'success');
      // Update text on the hidden button (might be useful for debugging or if element is shown later)
      processBtn.textContent = `Process (${count})`;
      processBtn.classList.add('flash');
      setTimeout(() => processBtn.classList.remove('flash'), 1000);
    });

    // Keyboard events (Add Escape key listener for closing)
    document.addEventListener('keydown', async (e) => {
      // ESC to close overlay
      if (e.key === 'Escape' && responseOverlay.classList.contains('visible')) {
         hideOverlay();
      }
      // Other keyboard shortcuts (like Ctrl+Shift+D for processing)
      // handled elsewhere (presumably main process or preload script)
      // remain unaffected.
    });
  };

  // Show overlay
  const showOverlay = () => {
    responseOverlay.classList.add('visible');
    // Update hidden button text, even if not visible
    window.electronAPI.getScreenshotCount().then(count => {
      screenshotCount = count;
      processBtn.textContent = `Process (${count})`;
    });
  };

  // Hide overlay
  const hideOverlay = () => {
    responseOverlay.classList.remove('visible');
  };

  // Initialize
  const init = async () => {
    setupMouseEvents();
    setupEventListeners();

    // Remove the welcome message/instructions on startup
    responseBox.innerHTML = '';
    
    // Check if there are already screenshots
    const count = await window.electronAPI.getScreenshotCount();
    if (count > 0) {
      // Update hidden button text
      processBtn.textContent = `Process (${count})`;
      showStatus(`${count} screenshot(s) loaded`, 'info');
    }
  };

  // Run initialization
  init();
});
