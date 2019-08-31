const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const Menu = electron.Menu;
const Tray = electron.Tray;
const ipcMain = electron.ipcMain;

const path = require("path");
const isDev = require("electron-is-dev");

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

    mainWindow = new BrowserWindow(options);
    // デバッグかどうか判断してURLを分ける
    // デバッグ中: ローカルサーバーを読み込む
    // アプリケーション: ビルドされたHTMLを読み込む
    mainWindow.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`);
    mainWindow.on("minimize", (event) => {
        event.preventDefault();
        mainWindow.hide();
    })
    mainWindow.on("closed", (event) => {
        if(isQuiting == false){
            event.preventDefault();
            mainWindow = null;
        }

        return false;
    });

    //メニューバーの設定
    createWindowMenu();
}

function createTray(){
    mainTray = new Tray("public/logo192.png");

    //右クリックしたときのメニュー
    const trayMenu = Menu.buildFromTemplate([
        { label: "Setting", click: () => {
            createWindow();
        }},
        { label: "Quit", click: () => {
            isQuiting = true;
            app.quit();
            mainTray.destroy();
        }}
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
                { role: "quit" }
            ]}
        ];
        const menuBar = Menu.buildFromTemplate(contextMenu);
        Menu.setApplicationMenu(menuBar);
    }
}

function sendSaveConfigSignal(){
    mainWindow.webContents.send("save-config", "save config.");
}

app.on("ready", () => {
    //ショートカットの作成
    globalShortcut.register(
        "CommandOrControl+Shift+M",
        () => {
            mainWindow.webContents.send("ctrl-shift-m", "capture screen.");
        }
    );

    createWindow();
    createTray();

    // 初期状態では非表示
    mainWindow.hide();
});
app.on("window-all-closed", () => {
    if(process.platform !== "darwin"){
        app.quit();
    }
});
app.on("activate", () => {
    if(mainWindow == null){
        createWindow();
    }
})