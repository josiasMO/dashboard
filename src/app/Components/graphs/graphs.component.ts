import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';
import { SharedataService } from '../../Services/sharedata.service';
// import { Chart } from 'chart.js';
import { Chart } from 'angular-highcharts';
import { StockChart } from 'angular-highcharts';

declare const Buffer;

//Model of Devices database
export interface Devices{
  app_name?: string;
  dev_id?: string;
  lat: number;
  lng: number;
}

class DevicesDatabase extends Dexie {
  values: Dexie.Table<Devices, number>;

  constructor() {
    super('devices');
    this.version(1).stores({
      values: '[app_name+dev_id], lat, lng'
    });
  }
}

export interface Parts {
  app_name?: string;
  dev_id?: string;
  port?: number;
  payload_fields?: boolean;
  parts?: any;
}

class PartsDatabase extends Dexie {
  values: Dexie.Table<Parts, number>;

  constructor() {
    super('parts');
    this.version(1).stores({
      values: '[app_name+dev_id+port], payload_fields, parts'
    });
  }
}

export interface Values {
  id?: number;
  application?: string;
  dev_id?: string;
  port?: number;
  counter?: number;
  payload_raw?: string;
  payload_fields?: boolean;
  airtime?: number;
  coding_rate?: string;
  data_rate?: string;
  freq?: number;
  timestamp?: string;
  gateways?: any;
};

class ValuesDatabase extends Dexie {
  values: Dexie.Table<Values, number>;

  constructor(db_name) {
    super(db_name);
    this.version(1).stores({
      values: '++id, [application+dev_id+port], counter, ' +
      'payload_raw, payload_fields, airtime, coding_rate, data_rate,'  +
      'freq, timestamp, gateways'
    });
  }
}

@Component({
  selector: 'app-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.css']
})
export class GraphsComponent implements OnInit {

  selectedApp: string;
  deviceConfig: FormGroup;
  devices = [];
  packet_parts = [];
  labels = [];
  x_labels = [];
  payload_fields = false;
  canvas: any;
  ctx: any;
  db_values = [];
  chart = [];
  keys = [];

  stock: StockChart;


  // variables that control readonly of forms
  deviceSelected = false;
  portSelected = false;
  x_selected = false;
  chart_control = false;
  dataLoaded = false;

  constructor(private data: SharedataService) {


    // first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),
    this.deviceConfig = new FormGroup({
      dev_id: new FormControl('', Validators.required),
      port: new FormControl('', [Validators.min(1), Validators.max(255), Validators.required]),
      x_label: new FormControl('', Validators.required),
      y_label: new FormControl('', Validators.required),
    });

  }

  ngOnInit() {
    // subscribe to service to retrieve app name
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
    this.load_devices();
  }

  load_devices() {
    const db_device = new DevicesDatabase();
    db_device.transaction('rw', db_device.values, async() => {
      const devs = await db_device.values.where('[app_name+dev_id]').between(
        [this.selectedApp, Dexie.minKey], [this.selectedApp, Dexie.maxKey]).toArray();
      this.devices = [];
      for (let dev of devs) {
        this.devices.push(dev.dev_id);
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  }

  changed(change) {
    if (change === 'device') {
      this.deviceSelected = true; // enables port form field

      // reset values of port and parts
      this.deviceConfig.patchValue({port: '', packet_parts: ''});
      this.portSelected = false;
    } else if (change === 'port') {
      // Verify if port is valid
      if (this.deviceConfig.value.port > 0 && this.deviceConfig.value.port < 256) {
        this.load_port_parts();
      } else {
        this.portSelected = false;
      }
    } else if (change === 'x_label') {
      this.x_selected = true;

    } else if (change === 'y_label') {
      this.load_data_device(true);
    }

  }

  load_port_parts() {
    this.packet_parts = [];
    const db_parts = new PartsDatabase();
    db_parts.transaction('rw', db_parts.values, async() => {
      const received_parts = await db_parts.values.where('[app_name+dev_id+port]').equals([this.selectedApp,
        this.deviceConfig.value.dev_id, this.deviceConfig.value.port]).toArray();
      this.packet_parts = received_parts[0].parts;
      this.payload_fields = received_parts[0].payload_fields;
      console.log('Payload Fields Marked: ', this.payload_fields);
      if (!this.payload_fields){
        for (let i = 0; i < this.packet_parts.length; i++){
          if (this.packet_parts[i].data_type === 'número') {
            this.labels.push(this.packet_parts[i].fieldname);
            this.x_labels.push(this.packet_parts[i].fieldname);
          }
        }
      } else {
        const db_values = new ValuesDatabase('received_values');
        db_values.transaction('rw', db_values.values, async () => {
          let storedValues = await db_values.values.where('[application+dev_id+port]')
            .equals([this.selectedApp, this.deviceConfig.value.dev_id, this.deviceConfig.value.port])
            .reverse().limit(1).toArray();

          if (storedValues.length === 0) {
            alert('Nenhum dado recebido na porta selecionada');
          } else {
            this.keys = Object.keys(storedValues[0].payload_fields);
            for (let i = 0; i < this.keys.length; i++){
              this.labels.push(this.keys[i]);
              this.x_labels.push(this.keys[i]);
            }
          }
        }).catch(e => {
          console.log(e.stack || e);
        });
      }
      this.x_labels.push('timestamp');

      this.portSelected = true; // enables packet_part form field

     }).catch(e => {
      alert('Partes não cadastradas na porta');
    });
  }

  load_data_device(parts_registered) {

    const db = new ValuesDatabase('received_values');

    db.transaction('rw', db.values, async () => {
      let storedValues = await db.values.where('[application+dev_id+port]')
        .equals([this.selectedApp, this.deviceConfig.value.dev_id, this.deviceConfig.value.port])
        .toArray();

      if (storedValues.length === 0) {
        alert('Nenhum dado recebido na porta selecionada');
      } else {
        this.db_values = [];

        if (parts_registered) {
          for (let i = 0; i < storedValues.length; i++) {
            this.db_values[i] = {
              id: storedValues[i].id,
              timestamp: storedValues[i].timestamp
            };

            if (this.payload_fields){
              this.keys = Object.keys(storedValues[i].payload_fields);
              const values = Object.values(storedValues[i].payload_fields);

              for (let j = 0; j < this.keys.length; j++) {
                this.db_values[i][this.keys[j]] = values[j];
              }

            } else {
              let string_msg = Buffer.from(storedValues[i].payload_raw, 'base64');

              let output_binary = '';
              for (let y = 0; y < string_msg.length; y++) {
                let raw_binary = string_msg[y].toString(2);
                if (raw_binary.length < 8) {
                  for (let x = 0; x <= 8 - raw_binary.length; x++) {
                    raw_binary = '0' + raw_binary;
                  }
                }
                output_binary += raw_binary;
              }

              for (let k = 0; k < this.packet_parts.length; k++) {
                if (this.packet_parts[k].data_type === 'número') {
                  let output_num = '';
                  for (let l = this.packet_parts[k].start_bit; l < this.packet_parts[k].end_bit; l = l + 8) {
                    const current_part = output_binary.substring(l, l + 8);
                    output_num += (parseInt(current_part, 2) - 48);
                  }
                  this.db_values[i][this.packet_parts[k].fieldname] = this.packet_parts[k].offset +
                    (parseFloat(output_num) * this.packet_parts[k].scale);

                } else if (this.packet_parts[k].data_type === 'string') {
                  const string_returned = this.binaryToString(
                    output_binary.substring(this.packet_parts[k].start_bit, this.packet_parts[k].end_bit + 1));
                  this.db_values[i][this.packet_parts[k].fieldname] = string_returned;

                } else if (this.packet_parts[k].data_type === 'booleano') {
                  const boolean_value = output_binary.substring(
                    this.packet_parts[k].start_bit, this.packet_parts[k].start_bit + 1);
                  this.db_values[i][this.packet_parts[k].fieldname] = (boolean_value === '1');
                }
              }
            }
          }
          this.dataLoaded = true;
        }
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  }

  binaryToString(str) {
      // Removes the spaces from the binary string
      str = str.replace(/\s+/g, '');
      // Pretty (correct) print binary (add a space every 8 characters)
      str = str.match(/.{1,8}/g).join(" ");

      let newBinary = str.split(" ");
      let binaryCode = [];

      for (let i = 0; i < newBinary.length; i++) {
        binaryCode.push(String.fromCharCode(parseInt(newBinary[i], 2)));
      }

      return binaryCode.join("");
    }


  addChart() {
    this.chart_control = true;

    let x_value, y_value;
    let series = [];
    for (let j = 0; j < this.deviceConfig.value.y_label.length; j++) {
      let data = [];
      for (let i = 0; i < this.db_values.length; i++) {
        if (this.deviceConfig.value.x_label === 'timestamp') {
          x_value = Date.parse(this.db_values[i][this.deviceConfig.value.x_label]);
        } else {
          x_value = this.db_values[i][this.deviceConfig.value.x_label];
        }
        y_value = this.db_values[i][this.deviceConfig.value.y_label[j]];
        data[i] = [x_value, parseFloat(y_value)];
      }
      series[j] = {
        name: this.deviceConfig.value.y_label[j],
        data: data
      };
    }
    this.stock = new StockChart({
      rangeSelector: {
        selected: 1
      },
      series: series
    });
   }
}
