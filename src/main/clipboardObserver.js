const { clipboard } = require('electron');
const clipboardEx = require('electron-clipboard-ex');
import { ClipboardItem } from './clipboardItem';


class ClipboardObserver{
  timer;  
  beforeText;
  beforeRtf;
  beforeHtml;
  beforeImage;
  beforeFiles;


  isStart = false;
  constructor(clipboardHistory){
    this.clipboardHistory = clipboardHistory;
  }

  setTimer(){
    this.timer = setInterval(() => {
      const text = clipboard.readText();
      const rtf = clipboard.readRTF();
      const html = clipboard.readHTML();
      let image_obj = clipboard.readImage();
      const image = image_obj.isEmpty() ? "" : image_obj.toDataURL();
      const files = clipboardEx.readFilePaths();

      
      if (this.isDiffText(this.beforeText, text) || this.isDiffRtf(this.beforeRtf, rtf) || this.isDiffHtml(this.beforeHtml, html) || this.isDiffImage(this.beforeImage, image) || this.isDiffFiles(this.beforeFiles, files)) {
        const timestamp = Date.now();
        const item = new ClipboardItem(text, rtf, html, image, files, timestamp);
        if (!item.isEmpty()){
          this.clipboardHistory.addItem(item);
          this.beforeText = text;
          this.beforeRtf = rtf;
          this.beforeHtml = html;
          this.beforeImage = image;
          this.beforeFiles = files;
        }


      }
    }, 500)
  }

  /**
   * 清除定时器
   */
  clearTimer() {
    clearInterval(this.timer);
  }
  
  /**
   * 设置剪贴板默认内容
   */
  setClipboardDefaultValue() {
    this.beforeText = clipboard.readText();
    this.beforeRtf = clipboard.readRTF();
    let image = clipboard.readImage();
    this.beforeImage = image.isEmpty() ? "" : image.toDataURL();
    this.beforeHtml = clipboard.readHTML();
    this.beforeFiles = clipboardEx.readFilePaths();
  }

  

  /**
   * 判断内容是否不一致
   * @param beforeText
   * @param afterText
   * @returns
   */
  isDiffText(beforeText, afterText) {
    return beforeText !== afterText;
  }
  /**
   * 判断rtf是否不一致
   * @param beforeRtf
   * @param afterRtf
   * @returns
   */
  isDiffRtf(beforeRtf, afterRtf) {
    return beforeRtf !== afterRtf;
  }

  /**
   * 判断图片是否不一致
   * @param beforeImage
   * @param afterImage
   * @returns
   */
  isDiffImage(beforeImage, afterImage) {
    return beforeImage !== afterImage;
  }

  /**
   * 判断文件是否不一致
   * @param beforeFiles
   * @param afterFiles
   * @returns
   */
  isDiffFiles(beforeFiles, afterFiles) {
    //判断两个数组是否不一致
    if (beforeFiles.length !== afterFiles.length) {
      return true;
    }
    for (let i = 0; i < beforeFiles.length; i++) {
      if (beforeFiles[i] !== afterFiles[i]) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 判断html是否不一致
   * @param beforeHtml
   * @param afterHtml
   * @returns
   */
  isDiffHtml(beforeHtml, afterHtml){
    return beforeHtml !== afterHtml;
  }

  /**
   * 开始
   */
  start() {
    this.setClipboardDefaultValue();
    this.setTimer();
    this.isStart = true;
  }

  /**
   * 暂停
   */
  stop() {
    this.clearTimer();
    this.isStart = false;
  }
}



export {ClipboardObserver};