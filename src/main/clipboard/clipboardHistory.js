import { ClipboardItem } from './clipboardItem'
import { nativeImage, clipboard } from 'electron'
import clipboardEx from 'electron-clipboard-ex'
import Store from 'electron-store'
import { hideWindow } from '../utils.js'

const store = new Store()

// 历史记录最大数量
const MAX_HISTORY_SIZE = 500

// 存储防抖延迟（毫秒）
const SAVE_DEBOUNCE_DELAY = 1500

class ClipboardHistory {
  constructor(window) {
    this.window = window //主窗口
    this.saveTimer = null // 防抖定时器
    const rawHistory = store.get('clipboard-history') || []
    this.history = []
    const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000
    const currentTime = Date.now()
    let needsCleanup = false

    for (let item of rawHistory) {
      //判断时间，如果当前item的时间戳与现在超过了7天，则不用添加到history
      if (currentTime - item.timestamp > SEVEN_DAYS_IN_MS) {
        needsCleanup = true
        continue
      }
      // 检查是否超过最大数量
      if (this.history.length >= MAX_HISTORY_SIZE) {
        needsCleanup = true
        break
      }
      try {
        const clipboardItem = ClipboardItem.createFromJSON(item)
        this.history.push(clipboardItem)
      } catch (error) {
        console.error('Failed to restore clipboard item:', error)
        needsCleanup = true
      }
    }

    // 如果有过期或无效数据被清理，保存清理后的结果
    if (needsCleanup) {
      store.set('clipboard-history', this.history)
    }
  }

  // 防抖保存到存储
  debounceSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }
    this.saveTimer = setTimeout(() => {
      store.set('clipboard-history', this.history)
      this.saveTimer = null
    }, SAVE_DEBOUNCE_DELAY)
  }

  // 立即保存（用于应用退出前）
  saveNow() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    store.set('clipboard-history', this.history)
  }

  addItem(object) {
    if (!(object instanceof ClipboardItem)) {
      throw new Error('object is not a instance of ClipboardItem')
    }

    //判断重复,如果重复则将重复的item移动到开头
    for (let item of this.history) {
      if (item.isSame(object)) {
        this.moveToTop(item.timestamp)
        return
      }
    }

    //添加到开头
    this.history.unshift(object)

    // 如果超过最大数量，删除最旧的记录
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.pop()
    }

    this.debounceSave() // 使用防抖保存
    // 检查窗口是否有效再发送
    if (this.window && !this.window.isDestroyed() && this.window.webContents) {
      this.window.webContents.send('add-clipboard-item', object) //向渲染进程添加
    }
  }

  //将timestamp为timestamp的item移动到第0个位置
  moveToTop(timestamp) {
    const index = this.history.findIndex((item) => item.timestamp === timestamp)
    if (index !== -1) {
      let deletedItem = this.history.splice(index, 1)[0]
      this.history.unshift(deletedItem)
      this.debounceSave() // 使用防抖保存
    }
  }

  //将timestamp为timestamp的item写入剪贴板
  async write2Clipboard(timestamp) {
    const item = this.history.find((item) => item.timestamp === timestamp)
    if (item) {
      if (item.type === 'files') {
        clipboardEx.writeFilePaths(item.file_paths || [])
      } else if (item.type === 'image' && item.image_url) {
        clipboard.writeImage(nativeImage.createFromDataURL(item.image_url))
      } else {
        clipboard.writeText(item.text || '')
      }
      //写入后隐藏窗口
      hideWindow(this.window)
    }
  }
}

export { ClipboardHistory }
