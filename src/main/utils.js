import { getPreviousWindow, activatePreviousWindow } from './windowManager.js'

function hideWindow(window) {
  if (window.isVisible()) {
    window.hide()
    activatePreviousWindow() // 异步执行，不阻塞
  }
}

function showWindow(window) {
  if (!window.isVisible()) {
    getPreviousWindow() // 同步获取当前窗口
    window.show()
  }
}

export { hideWindow, showWindow }
