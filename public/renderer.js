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
// プロセス間通信でショートカットの信号を受け取ったらキャプチャ
var ipcRenderer = electron.ipcRenderer;
ipcRenderer.on("ctrl-shift-m", function (arg) {
    console.log("caught shortcut command!");
    saveScreenImage();
});
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
var SlackAPI = /** @class */ (function () {
    function SlackAPI(key, channelID) {
        this.key = key;
        this.channelID = channelID;
        this.apiKey = "";
        this.channelID = "";
        this.apiKey = key;
        this.channelID = channelID;
    }
    SlackAPI.prototype.postImage = function (imagePath, imageTitle) {
        // 完全パスなのでファイル名だけ取り出す。
        var splitedPath = imagePath.split("/");
        var fileName = splitedPath[splitedPath.length - 1];
        var options = {
            url: SlackAPI.UPLOAD_URL,
            formData: {
                token: this.apiKey,
                title: imageTitle,
                filename: fileName,
                filetype: "auto",
                channels: this.channelID,
                file: fs.createReadStream(imagePath)
            }
        };
        request.post(options, function (error, response) {
            if (error) {
                console.log("Erorr by uploading file.");
                return;
            }
            console.log(JSON.parse(response));
        });
    };
    SlackAPI.UPLOAD_URL = "https://slack.com/api/files.upload";
    return SlackAPI;
}());
function saveScreenImage() {
    var savePath = "";
    console.log("save image...");
    // スクリーンショットの設定
    // 画面サイズの取得
    console.log(electron);
    var _a = electron.remote.screen.getPrimaryDisplay().workAreaSize, width = _a.width, height = _a.height;
    var options = {
        types: ["screen"],
        thumbnailSize: {
            width: width,
            height: height
        }
    };
    //デスクトップを撮影
    desktopCapture.getSources(options, function (error, sources) {
        //エラーが来たらここで終わり
        if (error) {
            console.log("failed to get screen sources.");
            return;
        }
        //取得したSourcesを総当たり
        sources.forEach(function (source) {
            console.log(source.name);
            //メインスクリーン、または1番目のスクリーンをスクリーンショットとする
            if (source.name == "Entire screen" || source.name == "Screen 1") {
                // 保存するディレクトリの設定
                var date = new Date();
                var imageFileName_1 = "screenshot_" + date.getTime().toString() + ".png";
                //OSが指定する一時ディレクトリ
                savePath = path.join(os.tmpdir(), imageFileName_1);
                //ファイルに書き込む
                fs.writeFile(savePath, source.thumbnail.toPNG(), function (error) {
                    if (error) {
                        console.log(error);
                        return;
                    }
                    var _a = config.get("apiElements"), apiKey = _a.apiKey, channelID = _a.channelID;
                    var slack = new SlackAPI(apiKey, channelID);
                    slack.postImage(savePath, imageFileName_1);
                    //通知を出すHTMLのAPI
                    notifyScreenshot("Saved current main screen.", savePath);
                    return savePath;
                });
            }
        });
    });
    //ここまで来たらエラーなので、空の文字列を返す
    return savePath;
}


//デバッグ
ipcRenderer.on("debug-console-log", (event, arg) => {
    console.log(arg);
});