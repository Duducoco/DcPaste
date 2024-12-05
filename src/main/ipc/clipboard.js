import { ipcMain } from 'electron';
const clipboardEx = require('electron-clipboard-ex');

export function registerClipboardHandlers(clipboardHistory) {
    // 获取剪贴板历史
    ipcMain.handle('init-clipboard-history', () => {
        return clipboardHistory.history.map(item => item.toJSON());
    });


    ipcMain.on('move-to-top', (event, timestamp) => {
        clipboardHistory.moveToTop(timestamp);
    });

    ipcMain.on('write2clipboard', (event, timestamp) => {
        clipboardHistory.write2Clipboard(timestamp);
    });

    

}