import { Component, OnInit, ViewChild } from '@angular/core';
import {MatTableDataSource, MatSort, MatPaginator} from '@angular/material';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';
import { SharedataService } from '../../Services/sharedata.service';

declare const Buffer;

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


@Component({
  selector: 'app-lora',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.css']
})
export class DataComponent implements OnInit {

  selectedApp: string;
  dataSource;
  deviceConfig: FormGroup;
  devices = [];
  packet_parts = [];
  displayedColumns = [];
  items_packet = [];
  payload_fields = false;
  keys = [];

  // variables that control readonly of forms
  deviceSelected = false;
  portSelected = false;
  loadTable = false;
  partsRegistered = false;

  DB_VALUES: Values[] = [];
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private data: SharedataService) {

    this.deviceConfig = new FormGroup({
      dev_id: new FormControl('', Validators.required),
      port: new FormControl('', [Validators.min(1), Validators.max(255), Validators.required]),
    });

  }

  ngOnInit() {
    // subscribe to service to retrieve app name
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
    this.load_devices();

  }

  // load list of devices from the current application and add them to drop down menu
  load_devices() {
    const db_device = new DevicesDatabase();
    db_device.transaction('rw', db_device.values, async() => {
      const devs = await db_device.values.where('[app_name+dev_id]').between(
        [this.selectedApp, Dexie.minKey], [this.selectedApp, Dexie.maxKey]).toArray();
      this.devices = [];
      for (let dev of devs) {
        this.devices.push(dev.dev_id);
      }
      console.log('Devices: ', this.devices);
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
    }
    if (change === 'port') {
      // Verify if port is valid
      if (this.deviceConfig.value.port > 0 && this.deviceConfig.value.port < 256) {
        this.portSelected = true; // enables packet_part form field
        this.load_port_parts();
      } else {
        this.portSelected = false;
      }
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
      this.load_data_device(true);

    }).catch(e => {
      this.load_data_device(false);
      console.log('Partes não cadastradas');
    });
  }

  load_data_device(parts_registered) {

    const db = new ValuesDatabase('received_values');

    db.transaction('rw', db.values, async() => {
      let storedValues = await db.values.where('[application+dev_id+port]')
        .equals([this.selectedApp, this.deviceConfig.value.dev_id, this.deviceConfig.value.port])
        .reverse().toArray();

      if (storedValues.length === 0) {
        alert('Nenhum dado recebido na porta selecionada');
      } else {
        this.DB_VALUES = [];
        console.log('Parts registered', parts_registered);

        if (parts_registered) {
          for (let i = 0; i < storedValues.length; i++) {
            this.DB_VALUES[i] = {
              id: storedValues[i].id,
              counter: storedValues[i].counter,
              port: storedValues[i].port,
              airtime: storedValues[i].airtime,
              data_rate: storedValues[i].data_rate,
              freq: storedValues[i].freq,
              timestamp: (new Date(storedValues[i].timestamp)).toLocaleString('pt-BR')};

            // console.log('Payload Fields', this.payload_fields);
            if (this.payload_fields){
              this.keys = Object.keys(storedValues[i].payload_fields);
              const values = Object.values(storedValues[i].payload_fields);

              for (let j = 0; j < this.keys.length; j++) {
                this.DB_VALUES[i][this.keys[j]] = values[j];

              }
              // console.log(this.DB_VALUES[i]);

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
                  for (let l = this.packet_parts[k].start_bit; l < this.packet_parts[k].end_bit;  l = l+8){
                    const current_part = output_binary.substring(l, l+8);
                    output_num += (parseInt(current_part, 2) - 48);
                  }
                  this.DB_VALUES[i][this.packet_parts[k].fieldname] = this.packet_parts[k].offset +
                      (parseFloat(output_num) * this.packet_parts[k].scale);

                } else if (this.packet_parts[k].data_type === 'string') {
                    const string_returned = this.binaryToString(
                      output_binary.substring(this.packet_parts[k].start_bit, this.packet_parts[k].end_bit+1));
                  this.DB_VALUES[i][this.packet_parts[k].fieldname] = string_returned;

                } else if (this.packet_parts[k].data_type === 'booleano') {
                  const boolean_value = output_binary.substring(
                    this.packet_parts[k].start_bit, this.packet_parts[k].start_bit+1);
                  this.DB_VALUES[i][this.packet_parts[k].fieldname] = (boolean_value === '1');
                }
              }
            }
          }

        } else {
          for (let i = 0; i < storedValues.length; i++) {
            this.DB_VALUES[i] = {
              id: storedValues[i].id,
              counter: storedValues[i].counter,
              port: storedValues[i].port,
              airtime: storedValues[i].airtime,
              data_rate: storedValues[i].data_rate,
              freq: storedValues[i].freq,
              timestamp: storedValues[i].timestamp,
              payload_raw: storedValues[i].payload_raw
            };
          }
        }
        this.create_table(parts_registered);
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


  create_table(parts_registered) {

    if (parts_registered) {
      this.items_packet = [];
      this.displayedColumns = ['id', 'counter', 'port', 'airtime', 'data_rate', 'freq', 'timestamp'];
      if (this.payload_fields) {
        console.log("Keys: ", this.keys);
        for (let i = 0; i < this.keys.length; i++) {
          this.displayedColumns.push(this.keys[i]);
          this.items_packet.push(this.keys[i]);
        }
        console.log("Displayed Columns: ", this.displayedColumns);
        console.log(this.DB_VALUES);
        this.partsRegistered = true;
        // this.displayedColumns.push(this.keys);
        // this.items_packet.push(this.keys);

      } else {
        for (let i = 0; i < this.packet_parts.length; i++) {
          this.displayedColumns.push(this.packet_parts[i].fieldname);
          this.items_packet.push(this.packet_parts[i].fieldname);
          this.partsRegistered = true;

        }
      }

    } else {
      this.partsRegistered = false;
      this.displayedColumns = ['id', 'counter', 'port', 'airtime', 'data_rate', 'freq', 'timestamp', 'payload_raw'];

    }
    this.dataSource = new MatTableDataSource(this.DB_VALUES);
    this.loadTable = true;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }


  convertToCSV(objArray) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = this.displayedColumns + '\r\n';

    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (let index in array[i]) {
        if (line != '') line += ','

        line += array[i][index];
      }

      str += line + '\r\n';
    }

    return str;
  }

  downloadCSV() {

    const jsonObject = JSON.stringify(this.DB_VALUES);
    const csv = this.convertToCSV(jsonObject);
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;' });
    const csvURL = window.URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', 'ActiveEvent_data.csv');
    tempLink.click();
  }

}


