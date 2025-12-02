import { clipboard } from 'electron'
import clipboardEx from 'electron-clipboard-ex'
import { ClipboardItem } from './clipboardItem'

class ClipboardObserver {
  constructor(clipboardHistory) {
    this.clipboardHistory = clipboardHistory
    this.timer = null
    this.beforeText = null
    this.beforeImage = null
    this.beforeFiles = null
    this.isStart = false
  }

  setTimer() {
    this.timer = setInterval(() => {
      try {
        const text = clipboard.readText()
        const files = clipboardEx.readFilePaths() || []

        const textChanged = this.isDiffText(this.beforeText, text)
        const filesChanged = this.isDiffFiles(this.beforeFiles, files)

        // 只有当文本和文件都为空或未变化时，才检查图片（避免昂贵的 toDataURL 操作）
        let image = this.beforeImage
        let imageChanged = false

        if (!textChanged && !filesChanged) {
          // 文本和文件都没变化，检查是否可能是图片
          const image_obj = clipboard.readImage()
          if (!image_obj.isEmpty()) {
            image = image_obj.toDataURL()
            imageChanged = this.isDiffImage(this.beforeImage, image)
          } else if (this.beforeImage) {
            // 之前有图片，现在没有了
            image = ''
            imageChanged = true
          }
        } else {
          // 文本或文件有变化，也读取一下图片状态
          const image_obj = clipboard.readImage()
          image = image_obj.isEmpty() ? '' : image_obj.toDataURL()
          imageChanged = this.isDiffImage(this.beforeImage, image)
        }

        if (textChanged || filesChanged || imageChanged) {
          const timestamp = Date.now()
          const item = new ClipboardItem(text, image, files, timestamp)
          if (!item.isEmpty()) {
            this.clipboardHistory.addItem(item)
            this.beforeText = text
            this.beforeImage = image
            this.beforeFiles = files
          }
        }
      } catch (error) {
        console.error('Error reading clipboard:', error)
      }
    }, 500)
  }

  /**
   * 清除定时器
   */
  clearTimer() {
    clearInterval(this.timer)
    this.timer = null
  }

  /**
   * 设置剪贴板默认内容
   */
  setClipboardDefaultValue() {
    try {
      this.beforeText = clipboard.readText()
      let image = clipboard.readImage()
      this.beforeImage = image.isEmpty() ? '' : image.toDataURL()
      this.beforeFiles = clipboardEx.readFilePaths() || []
    } catch (error) {
      console.error('Error reading clipboard default value:', error)
    }
  }

  /**
   * 判断内容是否不一致
   * @param beforeText
   * @param afterText
   * @returns
   */
  isDiffText(beforeText, afterText) {
    return beforeText !== afterText
  }

  /**
   * 判断图片是否不一致
   * @param beforeImage
   * @param afterImage
   * @returns
   */
  isDiffImage(beforeImage, afterImage) {
    return beforeImage !== afterImage
  }

  /**
   * 判断文件是否不一致
   * @param beforeFiles
   * @param afterFiles
   * @returns
   */
  isDiffFiles(beforeFiles, afterFiles) {
    //判断两个数组是否不一致
    // 处理 undefined 或 null 的情况
    if (!beforeFiles && !afterFiles) return false
    if (!beforeFiles || !afterFiles) return true
    if (beforeFiles.length !== afterFiles.length) {
      return true
    }
    for (let i = 0; i < beforeFiles.length; i++) {
      if (beforeFiles[i] !== afterFiles[i]) {
        return true
      }
    }
    return false
  }

  /**
   * 开始
   */
  start() {
    this.setClipboardDefaultValue()
    this.setTimer()
    this.isStart = true
  }

  /**
   * 暂停
   */
  stop() {
    this.clearTimer()
    this.isStart = false
  }
}

export { ClipboardObserver }
