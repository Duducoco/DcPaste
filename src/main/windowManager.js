import { windowManager } from '@johnlindquist/node-window-manager'

let previousWindow = null

// 同步获取，不阻塞主流程
function getPreviousWindow() {
  try {
    previousWindow = windowManager.getActiveWindow()
  } catch (error) {
    console.error('Error getting active window:', error)
  }
}

// 异步激活，不阻塞隐藏窗口
function activatePreviousWindow() {
  if (previousWindow) {
    // 使用 setImmediate 异步执行，避免阻塞
    setImmediate(() => {
      try {
        previousWindow.bringToTop()
      } catch (error) {
        console.error('Error activating previous window:', error)
      }
    })
  }
}

export { getPreviousWindow, activatePreviousWindow }
