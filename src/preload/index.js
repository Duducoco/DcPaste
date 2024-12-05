import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const clipboardApi = {
  //渲染进程调用主进程的函数，并获取返回值
  initClipboardHistory: () => ipcRenderer.invoke('init-clipboard-history'),

  // 主进程将timestamp为timestamp的item移动到第0个位置
  moveToTop: (timestamp) => ipcRenderer.send('move-to-top', timestamp),

  // 主进程向渲染进程发送剪贴板历史
  onAddClipboardItem: (callback) => ipcRenderer.on('add-clipboard-item', (_event, item) => callback(item)),

  // 将timestamp为timestamp的item写入剪贴板
  write2Clipboard: (timestamp) => ipcRenderer.send('write2clipboard', timestamp),
  
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('clipboard', clipboardApi)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.clipboard = clipboardApi
}
