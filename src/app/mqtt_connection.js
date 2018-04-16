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
   });
}

function storeDB(msg) {
  var db_app = new Dexie('applications');
  db_app.version(1).stores({
      values: '++id, app_name, port, app_key, devices'
  });

  db_app.transaction('rw', db_app.values, async() => {
    var app = await db_app.values.where('app_name').equals(msg.app_id).toArray();
    console.log(app[0].devices);
    if (!(app[0].devices.includes(msg.dev_id))) {
      console.log("Not equal");
      app[0].devices.push(msg.dev_id);
      db_app.values.where('app_name').equals(msg.app_id).modify(app[0]);
    } else {
      console.log("Equal");
    }
  }).catch(e => {
    console.log(e.stack || e);
  });

  var db_msg = new Dexie(msg.app_id + '_' + msg.dev_id);
  db_msg.version(1).stores({
    values: "++id, counter, payload_raw, port, airtime, coding_rate, data_rate, frequency, timestamp," +
    "gtw_id, gtw_channel, gtw_rssi, gtw_snr"
  });


  db_msg.values.add({counter: msg.counter,
    payload_raw:(msg.payload_raw == null)?'':msg.payload_raw,
    port: (msg.port == null)?'':msg.port,
    airtime: (msg.metadata.airtime == null)?'':msg.metadata.airtime,
    coding_rate: (msg.metadata.coding_rate == null)?'':msg.metadata.coding_rate,
    data_rate: (msg.metadata.data_rate == null)?'':msg.metadata.data_rate,
    frequency: (msg.metadata.frequency == null)?'':msg.metadata.frequency,
    timestamp: (msg.metadata.time == null)?'':msg.metadata.time,
    gtw_id: (msg.metadata.gateways == null)?'':msg.metadata.gateways[0].gtw_id,
    gtw_channel: (msg.metadata.gateways == null)?'':msg.metadata.gateways[0].channel,
    gtw_rssi: (msg.metadata.gateways == null)?'':msg.metadata.gateways[0].rssi,
    gtw_snr: (msg.metadata.gateways == null)?'':msg.metadata.gateways[0].snr
  }).then(function() {
    return db_msg.values.toArray();
  }).then(function () {
    console.log("Valor inserido");
  }).catch(function (e) {
    console.log("Error: " + (e.stack || e));
  });

}


