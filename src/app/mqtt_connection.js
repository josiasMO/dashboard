/**
 * Created by josias on 4/8/18.
 */

const mqtt = require('mqtt');
const dexie = require('dexie');

function connectMQTT(application, port, key, ttn_handler) {

   var options = {
     port: port,
     username: application,
     password: key,
     keepalive: 60
   };

   client  = mqtt.connect("mqtt://" + ttn_handler, options);

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
  // var db_app = new Dexie('applications');
  // db_app.version(1).stores({
  //     values: '++id, app_name, port, app_key, devices'
  // });
  var db_device = new Dexie('devices');
  db_device.version(1).stores({
    values: '[app_name+dev_id], lat, lng'
  });


  db_device.transaction('rw', db_device.values, async() => {

    var device = await db_device.values.where('[app_name+dev_id]').equals([msg.app_id, msg.dev_id]).toArray();
    if (device.length == 0) {
      db_device.values.add({app_name: msg.app_id,
                            dev_id: msg.dev_id,
                            lat: null,
                            lng: null});
      console.log("Device not Equal");
    } else {
        console.log("Equal");
    }
  }).catch(e => {
    console.log(e.stack || e);
  });

  var gateways_info = [];
  var gateways_packet = [];

  for(var i = 0; i < msg.metadata.gateways.length; i++){
    gateways_info.push({id: msg.metadata.gateways[i].gtw_id,
                        altitude: msg.metadata.gateways[i].altitude,
                        latitude: msg.metadata.gateways[i].latitude,
                        longitude: msg.metadata.gateways[i].longitude})
    gateways_packet.push({id: msg.metadata.gateways[i].gtw_id,
                          channel: msg.metadata.gateways[i].channel,
                          rf_chain: msg.metadata.gateways[i].rf_chain,
                          rssi: msg.metadata.gateways[i].rssi,
                          snr: msg.metadata.gateways[i].snr,
                          time: msg.metadata.gateways[i].time})
  }
  var db_gateways = new Dexie('gateways');
  db_gateways.version(1).stores({
    values: "gtw_id, altitude, latitude, longitude"
  });
  for(var i = 0; i < gateways_info.length; i++){
    if((db_gateways.values.where('gtw_id').equals(gateways_info[i].id).toArray()).length == 0) {
      db_gateways.values.add({
        gtw_id: gateways_info[i].id,
        altitude: gateways_info[i].altitude,
        latitude: gateways_info[i].latitude,
        longitude: gateways_info[i].longitude
      }).then(function () {
        return db_gateways.values.toArray();
      }).then(function () {
        console.log("Gateway inserted");
      }).catch(function (e) {
        console.log("Error inserting gateway: " + (e.stack || e));
      });
    }

  }

  var db_msg = new Dexie('received_values');
  db_msg.version(1).stores({
    values: "++id, [application+dev_id+port], counter, payload_raw, payload_fields, airtime, coding_rate, data_rate, " +
    "frequency, timestamp, gateways"
  });



  db_msg.values.add({application: msg.app_id,
    dev_id: msg.dev_id,
    port: (msg.port == null)?'':msg.port,
    counter: msg.counter,
    payload_raw:(msg.payload_raw == null)?'':msg.payload_raw,
    payload_fields:(msg.payload_fields == null)?'':msg.payload_fields,
    airtime: (msg.metadata.airtime == null)?'':msg.metadata.airtime,
    coding_rate: (msg.metadata.coding_rate == null)?'':msg.metadata.coding_rate,
    data_rate: (msg.metadata.data_rate == null)?'':msg.metadata.data_rate,
    frequency: (msg.metadata.frequency == null)?'':msg.metadata.frequency,
    timestamp: (msg.metadata.time == null)?'':msg.metadata.time,
    gateways: gateways_packet
  }).then(function() {
    return db_msg.values.toArray();
  }).then(function () {
    console.log("Valor inserido");
  }).catch(function (e) {
    console.log("Error: " + (e.stack || e));
  });

}


