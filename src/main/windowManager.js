import { windowManager } from '@johnlindquist/node-window-manager'

let previousWindow = null

async function getPreviousWindow() {
  try {
    previousWindow = windowManager.getActiveWindow()
  } catch (error) {
    console.error('Error getting active window:', error)
  }
}

async function activatePreviousWindow() {
  if (previousWindow) {
    try {
      previousWindow.bringToTop()
    } catch (error) {
      console.error('Error activating previous window:', error)
    }
  }
}

export { getPreviousWindow, activatePreviousWindow }
