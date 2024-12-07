// src/background.js
import { app, BrowserWindow, Tray, Menu, globalShortcut, screen, nativeTheme } from 'electron'
import {join} from 'path'
import {ClipboardObserver} from './clipboardObserver.js';
import {ClipboardHistory} from './clipboardHistory.js';
import { registerIpcHandlers } from './ipc';
const {powerMonitor} = require("electron")

const WINDOW_WIDTH = 800
const WINDOW_HEIGHT = 600

let mainWindow;
let tray = null;

const WHITE_ICON = join(__dirname, '../../resources', 'white.png')
const BLACK_ICON = join(__dirname, '../../resources', 'black.png')



function createWindow () {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    resizable: false,
    //删除滚动条以及滚动条的样式
    frame: false,
    show: false, // 默认隐藏
    // ...(process.platform === 'linux' ? { icon } : {}),
    icon: nativeTheme.shouldUseDarkColors ? WHITE_ICON : BLACK_ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }

   
  });

  // 禁用滚动条
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      ::-webkit-scrollbar {
        display: none;
      }
      * {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `);
  });

  mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  
  //失去焦点 自动隐藏
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });

  mainWindow.on('close', (e) => {
    e.preventDefault(); // 阻止退出程序
    mainWindow.setSkipTaskbar(true); // 取消任务栏显示
    mainWindow.hide(); // 隐藏主程序窗口
  })

  

  tray = new Tray(nativeTheme.shouldUseDarkColors ? WHITE_ICON : BLACK_ICON)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出', click: function () {
        mainWindow.destroy()
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)

  tray.setToolTip('DcPaste')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if(mainWindow.isVisible()){
      mainWindow.hide()
    }else{
      mainWindow.show()
    }
  })

  // 监听系统主题变化
  nativeTheme.on('updated', () => {
    tray.setImage(nativeTheme.shouldUseDarkColors ? WHITE_ICON : BLACK_ICON)
    mainWindow.setIcon(nativeTheme.shouldUseDarkColors ? WHITE_ICON : BLACK_ICON)
  })

}

let clipboardObserver = null;

app.on('ready', () => {
  createWindow();
  // 注册全局快捷键，例如 Ctrl+Shift+V
  const ret = globalShortcut.register('Alt+D', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      return;
    }
    if (mainWindow) {
      const cursorPos = screen.getCursorScreenPoint()
      const currentDisplay = screen.getDisplayNearestPoint(cursorPos)
      const { bounds } = currentDisplay
      const x = bounds.x + Math.round((bounds.width - WINDOW_WIDTH) / 2)
      const y = bounds.y + Math.round((bounds.height - WINDOW_HEIGHT) / 2)
      mainWindow.setBounds({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT
      })
      mainWindow.setPosition(x, y)
      mainWindow.setResizable(false)
      //显示窗口
      mainWindow.show();
      //将窗口聚焦
      mainWindow.focus();
    }
  });



  const clipboardHistory = new ClipboardHistory(mainWindow);
  clipboardObserver = new ClipboardObserver(clipboardHistory);
  registerIpcHandlers({ clipboardHistory });

  if (!ret) {
    console.log('Registration failed');
  }

  // 开始监控剪切板变化
  //如果已经是start状态，则不重复启动
  if(!clipboardObserver.isStart){
    clipboardObserver.start();
  }
  
});

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
 app.quit()
} else {
 app.on('second-instance', (event, commandLine, workingDirectory) => {
   // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
   if (mainWindow) {
     if (mainWindow.isMinimized()) mainWindow.restore()
     mainWindow.focus()
     mainWindow.show()
   }
 })
}
powerMonitor.on('lock-screen', () => {
  if(clipboardObserver.isStart){
    clipboardObserver.stop();
  }
})
powerMonitor.on('unlock-screen', () => {
  //如果已经是start状态，则不重复启动
  if(!clipboardObserver.isStart){
    clipboardObserver.start();
  }
})

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
  if(clipboardObserver.isStart){
    clipboardObserver.stop();
  }
  mainWindow.destroy();
});