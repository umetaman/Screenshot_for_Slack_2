"use strict";
var electron = window.nodeRequire("electron");
var desktopCapture = electron.desktopCapturer;
//設定の読み込み
var Config = window.nodeRequire("electron-config");
var config = new Config();
//ファイルの入出力とアップロード
var fs = window.nodeRequire("fs");
var os = window.nodeRequire("os");
var path = window.nodeRequire("path");
var request = window.nodeRequire("request");

//===============================================
//OSの通知
function notifyScreenshot(msg, imagePath) {
    var _notifier = new Notification("Screenshot for Slack", {
        body: msg,
        silent: true
    });
    _notifier.onclick = function () {
        //Shellから開く
        var _shell = electron.shell;
        _shell.openItem(imagePath);
    };
}

//===============================================
var ipcRenderer = electron.ipcRenderer;
ipcRenderer.on("capture-screen", (event, arg) => {
    saveScreenImage();
})

ipcRenderer.on("notify-screenshot", (event, arg) => {
    notifyScreenshot("Saved current main screen.", arg);
})

let tokenObj, channelIdObj;

// 画面の読み込みが済んだらElementを取得
window.onload = () => {
    tokenObj = document.querySelector("#input_token");
    channelIdObj = document.channel_select_form;
}

function saveScreenImage(){
    let savePath = "";
    console.log("Save image...");

    //スクリーンショットの設定
    const screenSize = electron.remote.screen.getPrimaryDisplay().workAreaSize;
    const options = {
        types: ["screen"],
        thumbnailSize: {
            width: screenSize.width,
            height: screenSize.height
        }
    };

    //デスクトップを撮影
    desktopCapture.getSources(options, (error, sources) => {
        if(error){
            console.log("failed to get screen sources.");
            console.log(error);
            return;
        }

        sources.forEach((source) => {
            //メインスクリーン、または1番目のスクリーンを取得
            if(source.name == "Entire screen" || source.name == "Screen 1"){
                //保存するディレクトリを設定
                const date = new Date();
                const imageFileName = "screenshot_" + date.getTime().toString() + ".png";

                //OSが指定する一時ディレクトリに保存
                savePath = path.join(os.tmpdir(), imageFileName);

                //ファイルに書き込む
                fs.writeFile(savePath, source.thumbnail.toPNG(), (error) => {
                    if(error){
                        console.log(error);
                        return;
                    }

                    //メインプロセスへ
                    const uploadProps = {
                        path: savePath,
                        title: imageFileName
                    };

                    console.log(uploadProps);
                    ipcRenderer.send("upload-image-to-slack", uploadProps);
                    console.log("send save-signal to main process.");

                    return savePath;
                });
            }
        });
    });

    //文字列は返すけど、空の文字列
    //ここまできたらエラー
    return savePath;
}

//デバッグ
ipcRenderer.on("debug-console-log", (event, arg) => {
    console.log(arg);
});

//チャンネルのIDを保存
ipcRenderer.on("save-config", (event, arg) => {
    config.set("token", tokenObj.value);
    
    for(let i = 0; i < channelIdObj.channels.length - 1; i++){
        if(channelIdObj.channels[i].checked){
            config.set("id", channelIdObj.channels[i].value);
            ipcRenderer.send("debug-console-log-main", "saved: " + channelIdObj.channels[i].value);
            break;
        }
    }
});