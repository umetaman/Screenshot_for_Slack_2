const SlackAPI = require("./SlackAPI.js");

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const Menu = electron.Menu;
const Tray = electron.Tray;
const ipcMain = electron.ipcMain;
const desktopCapture = electron.desktopCapturer;
const NativeImage = electron.nativeImage;

const path = require("path");
const isDev = require("electron-is-dev");
const request = require("request");
const os = require("os");
const fs = require("fs");

const Config = require("electron-config");
const config = new Config();

let mainWindow;
let mainTray;
let isQuiting = false;


function createWindow(){
    const options = {
        width: 500,
        height: 500,
        webPreferences: {
            nodeIntegration: true
        }
    };

    //mainWindowの表示と非表示を切り替える
    mainWindow = new BrowserWindow(options);

    // デバッグかどうか判断してURLを分ける
    // デバッグ中: ローカルサーバーを読み込む
    // アプリケーション: ビルドされたHTMLを読み込む
    mainWindow.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`);
    mainWindow.webContents.openDevTools();

    //最小化
    mainWindow.on("minimize", (event) => {
        console.log("[EventHandler] Minimize window.");
        sendSaveConfigSignal();
        mainWindow.hide();
    })

    mainWindow.on("close", (event) => {
        console.log("[EventHandler] Close window.");
        sendSaveConfigSignal();
        mainWindow.hide();
        if(isQuiting == false){
            event.preventDefault();
        }
    })

    mainWindow.on("closed", (event) => {
        console.log("[EventHandler] Closed window.");
    });

    //メニューバーの設定
    createWindowMenu();
}

function createTray(){
    const iconImage = NativeImage.createFromPath(path.join(__dirname, "Assets/cloudTemplate.png"));
    mainTray = new Tray(iconImage);

    //タスクトレイメニュー
    const trayMenu = Menu.buildFromTemplate([
        { label: "Setting", click: () => {
            if(mainWindow != null){
                mainWindow.show();
            }else{
                createWindow();
            }
        }},
        {
            label: "Quit",
            //通常のアプリとは終了方法が違う。
            click: () => {
                sendSaveConfigSignal();
                isQuiting = true;
                app.quit();
            }
        }
    ]);

    mainTray.setToolTip("Screenshot for Slack 2");
    mainTray.setContextMenu(trayMenu);
}

function createWindowMenu(){
    //Windowを表示するたびに実行する必要あり

    if(process.platform !== "darwin"){
        mainWindow.removeMenu();
    }else{
        const contextMenu = [
            { label: app.getName(), submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste"},
                { type: "separator" },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    //通常のアプリとは終了方法が違う。
                    click: () => {
                        sendSaveConfigSignal();
                        isQuiting = true;
                        app.quit();
                    }
                }
            ]}
        ];

        const menuBar = Menu.buildFromTemplate(contextMenu);
        Menu.setApplicationMenu(menuBar);
    }
}

function sendSaveConfigSignal(){
    console.log("[Save configuration.]");
    if(mainWindow.webContents != null){
        mainWindow.webContents.send("save-config", "save config.");
    }
}

app.on("ready", () => {
    //デバッグ
    ipcMain.on("debug-console-log-main", (event, arg) => {
        console.log(arg);
    })

    ipcMain.on("upload-image-to-slack", (event, args) => {
        const token = config.get("token");
        const id = config.get("id");
        const slack = new SlackAPI(token, id);
        console.log(args);
        slack.postImage(args.path, args.title, () => {
            mainWindow.webContents.send("notify-screenshot", args.path);
        });
    })

    //ショートカットの作成
    globalShortcut.register(
        "CommandOrControl+Shift+M",
        () => {
            mainWindow.webContents.send("capture-screen", "capture");
        }
    );

    createWindow();
    createTray();
});

app.on("will-quit", () => {
    console.log("[EventHandler] Window will quit.");
    isQuiting = true;
});

app.on("window-all-closed", (event) => {
    console.log("[EventHandler] Window all closed.");
    if(process.platform !== "darwin"){
        app.quit();
    }
});

app.on("activate", () => {
    if(mainWindow == null){
        createWindow();
    }
});

//レンダラープロセスからの受取
ipcMain.on("input-api-token", (event, arg) => {
    const CHANNEL_LIST_URL = "https://slack.com/api/channels.list";
    const TEAM_INFO_URL = "https://slack.com/api/team.info";
    
    if(arg == ""){
        console.log("Input token is blank.");
        event.reply("receive-data", null);
        return;
    }

    let options = {
        url: "",
        formData: {
            token: arg
        }
    };

    let data = {
        ok: {
            teamInfo: false,
            channelList: false
        },
        teamName: "",
        teamIcon: "",
        channels: []
    };

    //チーム名とアイコンを取得
    options.url = TEAM_INFO_URL;
    request.post(options, (error, response) => {
        if(error){
            console.log(error);
            return;
        }

        const _res = JSON.parse(response.body);
        data.ok.teamInfo = _res.ok;

        //OK以外のレスポンスは無視
        if(_res.ok == true){
            console.log("get response");
            data.teamName = _res.team.name;
            data.teamIcon = _res.team.icon.image_68;
        }
    });

    //チャンネル一覧を取得
    options.url = CHANNEL_LIST_URL;
    request.post(options, (error, response) => {
        if(error){
            console.log(error);
            return;
        }

        const _res = JSON.parse(response.body);
        data.ok.channelList = _res.ok;

        //きちんと初期化
        data.channels = [];

        //OK以外のレスポンスは無視
        if(_res.ok == true){
            _res.channels.forEach(channel => {
                data.channels.push({ id: channel.id, name: channel.name });
            });
        }
    });

    setTimeout(() => {
        console.log(data);
        if(data.ok.teamInfo && data.ok.channelList){
            event.reply("receive-data", data);
        }
    }, 700);
    
});