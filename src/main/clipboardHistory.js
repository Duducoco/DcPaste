import {ClipboardItem} from './clipboardItem';
import { nativeImage } from 'electron';
import clipboardEx from 'electron-clipboard-ex';
const { clipboard } = require('electron');
import Store from 'electron-store';
const store = new Store();


class ClipboardHistory {
    constructor(window) {
        this.window = window; //主窗口
        const rawHistory = store.get('clipboard-history') || [];
        this.history = [];
        for (let item of rawHistory) {
            try {
                const clipboardItem = ClipboardItem.createFromJSON(item);
                this.history.push(clipboardItem);
            } catch (error) {
                console.error('Failed to restore clipboard item:', error);
            }
        }
        
    }

    addItem(object) {
        if (!(object instanceof ClipboardItem)) {
            throw new Error('object is not a instance of ClipboardItem');
        }

        //判断重复,如果重复则将重复的item移动到开头
        for (let item of this.history) {
            if (item.isSame(object)) {
                this.moveToTop(item.timestamp);
                return;
            }
        }
        

        //添加到开头
        this.history.unshift(object);
        store.set('clipboard-history', this.history);
        this.window.webContents.send('add-clipboard-item', object);  //向渲染进程添加
    }

    //将timestamp为timestamp的item移动到第0个位置
    moveToTop(timestamp){
        const index = this.history.findIndex(item => item.timestamp === timestamp);
        if (index !== -1) {
            let deletedItem = this.history.splice(index, 1)[0];
            this.history.unshift(deletedItem);
            store.set('clipboard-history', this.history);
        }
    }

    //将timestamp为timestamp的item写入剪贴板
    write2Clipboard(timestamp){
        const item = this.history.find(item => item.timestamp === timestamp);
        if (item) {

            if(item.type === 'files'){
                clipboardEx.writeFilePaths(item.file_paths);
            }else if (item.type === 'image' && item.image_url !== ''){
                clipboard.writeImage(nativeImage.createFromDataURL(item.image_url));
            }else {
                clipboard.write({
                    text: item.text,
                    rtf: item.rtf,
                    html: item.html,
                });

            }
        }
        //写入后隐藏窗口
        if (this.window.isVisible()) {
            this.window.hide();
        }
    }


}



export {ClipboardHistory};