class ClipboardItem {
  constructor(text, image_url, file_paths, timestamp) {
    this.text = text || '' //string
    this.image_url = image_url || '' //string
    this.file_paths = file_paths || [] //string[]
    this.timestamp = timestamp

    //判断类型
    if (this.image_url) {
      this.type = 'image'
    } else if (this.file_paths && this.file_paths.length > 0) {
      this.type = 'files'
    } else if (this.text) {
      this.type = 'text'
    } else {
      this.type = 'unknown'
    }
  }

  isEmpty() {
    return (
      this.text === '' &&
      this.image_url === '' &&
      (!this.file_paths || this.file_paths.length === 0)
    )
  }

  //判断是否重复
  isSame(item) {
    if (this.type !== item.type) {
      return false
    }
    if (this.type === 'image') {
      return this.image_url === item.image_url
    } else if (this.type === 'files') {
      // 优化：直接比较数组，避免 JSON.stringify 开销
      const a = this.file_paths || []
      const b = item.file_paths || []
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    } else {
      return this.text === item.text
    }
  }

  toJSON() {
    return {
      type: this.type,
      text: this.text,
      image_url: this.image_url,
      file_paths: this.file_paths,
      timestamp: this.timestamp
    }
  }

  static createFromJSON(json) {
    return new ClipboardItem(json.text, json.image_url, json.file_paths, json.timestamp)
  }
}

export { ClipboardItem }
