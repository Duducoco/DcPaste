import { ipcMain } from 'electron'

export function registerClipboardHandlers(clipboardHistory) {
  // 获取剪贴板历史
  const initHandler = () => {
    return clipboardHistory.history.map((item) => item.toJSON())
  }
  ipcMain.handle('init-clipboard-history', initHandler)

  const moveToTopHandler = (event, timestamp) => {
    clipboardHistory.moveToTop(timestamp)
  }
  ipcMain.on('move-to-top', moveToTopHandler)

  const write2ClipboardHandler = (event, timestamp) => {
    clipboardHistory.write2Clipboard(timestamp)
  }
  ipcMain.on('write2clipboard', write2ClipboardHandler)

  // 返回清理函数
  return () => {
    ipcMain.removeHandler('init-clipboard-history')
    ipcMain.removeListener('move-to-top', moveToTopHandler)
    ipcMain.removeListener('write2clipboard', write2ClipboardHandler)
  }
}
