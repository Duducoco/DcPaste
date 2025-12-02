import { registerClipboardHandlers } from './clipboard'
// 将来可能的其他 IPC 模块
// import { registerOtherHandlers } from './other';

export function registerIpcHandlers(dependencies) {
  const cleanupClipboard = registerClipboardHandlers(dependencies.clipboardHistory)
  // const cleanupOther = registerOtherHandlers(dependencies.other);

  // 返回清理函数
  return () => {
    cleanupClipboard()
    // cleanupOther();
  }
}
