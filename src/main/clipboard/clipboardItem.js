class ClipboardItem{
    constructor(text, rtf, html, image_url, file_paths, timestamp){
        this.text = text;  //string
        this.rtf = rtf;  //string
        this.html = html;  //string
        this.image_url = image_url;  //string
        this.file_paths = file_paths;  //string[]
        this.timestamp = timestamp;


        //判断类型
        if (this.image_url){
            this.type = 'image';
        }else if (this.file_paths && this.file_paths.length > 0){
            this.type = 'files';
        }else if (this.rtf){
            this.type = 'rtf';
        }else if (this.html){
            this.type = 'html';
        }else if (this.text){
            this.type = 'text';
        }
    }

    isEmpty(){
        return this.text === '' && this.rtf === '' && this.html === '' && this.image_url === '' && this.file_paths.length === 0;
    }

    //判断是否重复
    isSame(item){
        if(this.type !== item.type){
            return false;
        }
        if(this.type === 'image'){
            return this.image_url === item.image_url;
        }else if(this.type === 'files'){
            return JSON.stringify(this.file_paths) === JSON.stringify(item.file_paths);
        }else{
            return this.text === item.text && this.rtf === item.rtf && this.html === item.html;
        }
    }

    toJSON(){
        return {
            type: this.type,
            text: this.text,
            rtf: this.rtf,
            html: this.html,
            image_url: this.image_url,
            file_paths: this.file_paths,
            timestamp:this.timestamp
        }
    }



    static createFromJSON(json){
        return new ClipboardItem(json.text, json.rtf, json.html, json.image_url, json.file_paths, json.timestamp);
    }
}



export { ClipboardItem };