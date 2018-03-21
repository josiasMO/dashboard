const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const mqtt = require('mqtt');

// var indexedDB;

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron', 'src'),
  hardResetMethod: 'exit'
});

let win;
let client;

function createWindow () {
  win = new BrowserWindow({width: 800, height: 600, fullScreen: true});


  // load the dist folder from Angular
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'dist/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools optionally:
  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
    client.end();
  });
}



function connectMQTT() {



  var options = {
    port: 1883,
    username: "ufsm_lora",
    password: "ttn-account-v2.ASUiRfuLwBCxz31WhJM0xCkjaMwOKFWQL47C2Xg0H78",
    keepalive: 60
  };

  client  = mqtt.connect("mqtt://brazil.thethings.network", options);

  client.on('connect', function () {
    console.log("Connected");
    client.subscribe('ufsm_lora/devices/rhf76-052/up');
  });

  client.on('message', function (topic, message) {
    // message is Buffer
    var msg= JSON.parse(message.toString());
    var string_msg = Buffer.from(msg.payload_raw, 'base64').toString()
    console.log(string_msg);
    storeDB(string_msg);

  });

}

function storeDB(value) {


}

app.on('ready', createWindow);

app.on('ready', connectMQTT);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
