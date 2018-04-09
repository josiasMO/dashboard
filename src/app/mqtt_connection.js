/**
 * Created by josias on 4/8/18.
 */

const mqtt = require('mqtt');
const dexie = require('dexie');

function connectMQTT(application, port, key) {

   var options = {
     port: port,
     username: application,
     password: key,
     // port: 1883,
     // username: "ufsm_lora",
     // password: "ttn-account-v2.ASUiRfuLwBCxz31WhJM0xCkjaMwOKFWQL47C2Xg0H78",
     // username: "bufsm",
     // password: "ttn-account-v2.xWQUWuF67urQXZI7HBRM1Rr0cYqXp4EYeXOg6blnzxM",

     keepalive: 60
   };

   client  = mqtt.connect("mqtt://brazil.thethings.network", options);

   client.on('connect', function () {
     console.log("Connected");
     client.subscribe(application+'/devices/+/up');
   });

   client.on('message', function (topic, message) {
     // message is Buffer
     var msg= JSON.parse(message.toString());
     console.log(msg);
     storeDB(msg);
//      var string_msg = Buffer.from(msg.payload_raw, 'base64').toString();
//      console.log(string_msg);
//      storeDB(string_msg);

   });
}

function storeDB(msg) {
  console.log(msg.dev_id);
  var db = new Dexie('applications');
  db.version(1).stores({
      values: '++id, appName, port, appKey, devices'
  });


  // db.transaction('rw', db.values, async() => {
  //
  //   var app = await db.values.where('appName').equals(msg.app_id).toArray();
  //   const result = app.devices.find(x => x.dev_id === msg.dev_id);
  //   console.log(JSON.stringify(app), result);
  //
  //   for(var x in app.devices){
  //
  //   }
  // }).catch(e => {
  //   console.log(e.stack || e);
  // });

  // var db = new Dexie(msg.dev_id);
  // db.version(1).stores({
  //   values: "++id, counter, payload_raw, port, airtime, coding_rate, data_rate, frequency, timestamp," +
  //   "gtw_id, gtw_channel, gtw_rssi, gtw_snr"
  // });
  //
  // db.values.add({counter: msg.counter,
  //   payload_raw: msg.payload_raw,
  //   port: msg.port,
  //   airtime: msg.metadata.airtime,
  //   coding_rate: msg.metadata.coding_rate,
  //   data_rate: msg.metadata.data_rate,
  //   frequency: msg.metadata.frequency,
  //   timestamp: msg.metadata.time,
  //   gtw_id: msg.metadata.gateways[0].gtw_id,
  //   gtw_channel: msg.metadata.gateways[0].channel,
  //   gtw_rssi: msg.metadata.gateways[0].rssi,
  //   gtw_snr: msg.metadata.gateways[0].snr
  // }).then(function() {
  //   return db.values.toArray();
  // }).then(function (storedValues) {
  //   console.log("Valor inserido");
  // }).catch(function (e) {
  //   console.log("Error: " + (e.stack || e));
  // });

  //
  // Manipulate and Query Database
  //
//      db.friends.add({name: "Josephine "+value, age: 21}).then(function() {
//        return db.friends.where("age").below(25).toArray();
//      }).then(function (youngFriends) {
//        console.log("My young friends: " + JSON.stringify(youngFriends));
//      }).catch(function (e) {
//        console.log("Error: " + (e.stack || e));
//      });
}

function addDevice(dev_id) {


}
