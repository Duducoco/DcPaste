import { getPreviousWindow, activatePreviousWindow } from './windowManager.js';
 
async function hideWindow(window){
    if (window.isVisible()){
        window.hide();
        await activatePreviousWindow();
    }
}


async function showWindow(window){
    if (!window.isVisible()){
        await getPreviousWindow();
        window.show();
    }
}

export{
    hideWindow,
    showWindow
}
