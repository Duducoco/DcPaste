import { registerClipboardHandlers } from './clipboard';
// 将来可能的其他 IPC 模块
// import { registerOtherHandlers } from './other';

export function registerIpcHandlers(dependencies) {
    registerClipboardHandlers(dependencies.clipboardHistory);
    // registerOtherHandlers(dependencies.other);
}