const { exec } = require('child_process');
const { windowManager } = require("@johnlindquist/node-window-manager");
let previousWindow = null;

async function getPreviousWindow() {
  try {
    previousWindow = await windowManager.getActiveWindow();
  } catch (error) {
    console.error('Error getting active window:', error);
  }
}

async function activatePreviousWindow() {
  if (previousWindow) {
    try {
      previousWindow.bringToTop();

    } catch (error) {
      console.error('Error activating previous window:', error);
    }
  }
}

export {
  getPreviousWindow,
  activatePreviousWindow
}; 