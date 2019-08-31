"use strict";
var electron = require("electron");
var Config = require("electron-config");
var config = new Config();
var ipcRenderer = electron.ipcRenderer;
function saveConfig(apiKey, channelID) {
    config.set("apiElements.apiKey", apiKey);
    config.set("apiElements.channelID", channelID);
}
ipcRenderer.on("save-config", function () {
    console.log("save config.");
});
