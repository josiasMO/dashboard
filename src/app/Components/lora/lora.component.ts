import { Component, OnInit, ViewChild } from '@angular/core';
import {MatTableDataSource, MatSort} from '@angular/material';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';
import { SharedataService } from '../../sharedata.service';

declare const Buffer;

export interface Values {
  id?: number;
  counter?: number;
  payload_raw?: string;
  port?: number;
  airtime?: number;
  coding_rate?: string;
  data_rate?: string;
  frequency?: number;
  timestamp?: string;
  gtw_id?: string;
  gtw_channel?: number;
  gtw_rssi?: number;
  gtw_snr?: number;
}
class ValuesDatabase extends Dexie {
  values: Dexie.Table<Values, number>;

  constructor(db_name) {
    super(db_name);
    this.version(1).stores({
      values: '++id, counter, payload_raw, port, airtime, coding_rate, data_rate, frequency, timestamp,' +
      'gtw_id, gtw_channel, gtw_rssi, gtw_snr'
    });
  }
}

//Model of Application database
export interface Application {
  id?: number;
  app_name?: string;
  port?: number;
  app_key?: string;
  devices?: any;
}

class ApplicationsDatabase extends Dexie {
  values: Dexie.Table<Application, number>;

  constructor() {
    super('applications');
    this.version(1).stores({
      values: '++id, app_name, port, app_key, devices'
    });
  }
}

export interface Parts {
  id?: number;
  app_name?: string;
  dev_id?: string;
  port?: number;
  parts?: any;
}

class PartsDatabase extends Dexie {
  values: Dexie.Table<Parts, number>;

  constructor() {
    super('parts');
    this.version(1).stores({
      values: '[app_name+dev_id+port], parts'
    });
  }
}


@Component({
  selector: 'app-lora',
  templateUrl: './lora.component.html',
  styleUrls: ['./lora.component.css']
})
export class LoraComponent implements OnInit {

  selectedApp: string;
  dataSource;
  deviceConfig: FormGroup;
  devices = [];
  packet_parts = [];
  displayedColumns = [];//'id', 'counter', 'port', 'airtime', 'data_rate', 'frequency', 'timestamp', 'payload_raw'];
  items_packet = [];

  //variables that control readonly of forms
  deviceSelected = false;
  portSelected = false;
  loadTable = false;
  partsRegistered = false;

  DB_VALUES: Values[] = [];
  @ViewChild(MatSort) sort: MatSort;

  constructor(private data: SharedataService) {

    this.deviceConfig = new FormGroup({
      dev_id: new FormControl('', Validators.required),
      port: new FormControl('', [Validators.min(1), Validators.max(255), Validators.required]),
    });

  }



  ngOnInit() {
    //subscribe to service to retrieve app name
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
    this.load_devices();

  }

  //load list of devices from the current application and add them to dropdown menu
  load_devices() {
    const db_app = new ApplicationsDatabase();
    db_app.transaction('rw', db_app.values, async() => {
      const app = await db_app.values.where('app_name').equals(this.selectedApp).toArray();
      this.devices = app[0].devices;
    }).catch(e => {
      console.log(e.stack || e);
    });
  }

  changed(change) {
    console.log(change);
    if (change === 'device') {
      this.deviceSelected = true; //enables port form field

      //reset values of port and parts
      this.deviceConfig.patchValue({port: '', packet_parts: ''});
      this.portSelected = false;
    }
    if (change === 'port') {
      //Verify if port is valid
      if (this.deviceConfig.value.port > 0 && this.deviceConfig.value.port < 256) {
        this.portSelected = true; //enables packet_part form field
        this.load_port_parts();
      } else {
        this.portSelected = false;
      }
    }
  }

  load_port_parts(){
    this.packet_parts = [];
    const db_parts = new PartsDatabase();
    db_parts.transaction('rw', db_parts.values, async() => {
      const received_parts = await db_parts.values.where('[app_name+dev_id+port]').equals([this.selectedApp,
        this.deviceConfig.value.dev_id, this.deviceConfig.value.port]).toArray();
      this.packet_parts = received_parts[0].parts;
      // console.log('Parts1: ', JSON.stringify(this.packet_parts));
      this.load_data_device(true);

    }).catch(e => {
      this.load_data_device(false);
      console.log(e.stack || e);
    });
  }

  load_data_device(parts_registered) {

    const db = new ValuesDatabase(this.selectedApp + '_' + this.deviceConfig.value.dev_id);

    db.transaction('rw', db.values, async() => {
      let storedValues = await db.values.orderBy('timestamp').reverse()
        .and(x => x.port === this.deviceConfig.value.port).limit(100).toArray();

      if (storedValues.length === 0) {
        alert('Nenhum dado recebido na porta selecionada');
      } else {

        if (parts_registered) {

          for (let i = 0; i < storedValues.length; i++) {
            this.DB_VALUES[i] = {
              id: storedValues[i].id,
              counter: storedValues[i].counter,
              port: storedValues[i].port,
              airtime: storedValues[i].airtime,
              data_rate: storedValues[i].data_rate,
              frequency: storedValues[i].frequency,
              timestamp: (new Date(storedValues[i].timestamp)).toLocaleString('pt-BR')};



            let string_msg = Buffer.from(storedValues[i].payload_raw, 'base64');
            // console.log(storedValues[i].payload_raw.toString(), string_msg);

            let output_binary = '';
            for (let y = 0; y < string_msg.length; y++) {
              let raw_binary = string_msg[y].toString(2);
              for (let x = 0; x <= 8 - raw_binary.length; x++)
                raw_binary = '0' + raw_binary;
              output_binary += raw_binary;
            }

            for (let k = 0; k < this.packet_parts.length; k++) {
              if (this.packet_parts[k].data_type === 'número' ){
                let output_num = '';
                for (let l = this.packet_parts[k].start_bit; l < this.packet_parts[k].end_bit;  l = l+8){
                  const current_part = output_binary.substring(l, l+8);
                  output_num += (parseInt(current_part, 2) - 48);
                }
                if(this.packet_parts[k].offset < 0)
                  this.DB_VALUES[i][this.packet_parts[k].fieldname] = this.packet_parts[k].offset -
                    (parseFloat(output_num) * (10**this.packet_parts[k].scale));
                else
                  this.DB_VALUES[i][this.packet_parts[k].fieldname] = this.packet_parts[k].offset +
                    (parseFloat(output_num) * (10**this.packet_parts[k].scale));
              }
              // else if (this.packet_parts[k].type === 'string'){
              //
              // } else {
              //
              // }
              // // console.log('Part: ', k, this.packet_parts[k].start_bit, this.packet_parts[k].end_bit,
              //   this.packet_parts[k].scale, this.packet_parts[k].offset);
              // this.DB_VALUES[i][this.packet_parts[k].fieldname] = storedValues[i].payload_raw;
            }

          }
          // 'número', 'string', 'booleano']

        } else {
          for (let i = 0; i < storedValues.length; i++) {
            this.DB_VALUES[i] = {
              id: storedValues[i].id,
              counter: storedValues[i].counter,
              port: storedValues[i].port,
              airtime: storedValues[i].airtime,
              data_rate: storedValues[i].data_rate,
              frequency: storedValues[i].frequency,
              timestamp: storedValues[i].timestamp,
              payload_raw: storedValues[i].payload_raw
            };
          }
        }


        // let string_msg = Buffer.from(this.DB_VALUES[0].payload_raw, 'base64').toString();
        // console.log('Mensagem: -29.' + string_msg.slice(0, 5) + ',  -53.' + string_msg.slice(5));
        // console.log('Bits: ' +  this.DB_VALUES[0].payload_raw.charCodeAt(0).toString(2));

        this.create_table(parts_registered);
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  };



  create_table(parts_registered) {

    if (parts_registered){
      this.items_packet = [];
      this.displayedColumns = ['id', 'counter', 'port', 'airtime', 'data_rate', 'frequency', 'timestamp'];
      for (let i = 0; i < this.packet_parts.length; i++){
        this.displayedColumns.push(this.packet_parts[i].fieldname);
        this.items_packet.push(this.packet_parts[i].fieldname);
        this.partsRegistered = true;

      }

    } else {
      this.partsRegistered = false;
      this.displayedColumns = ['id', 'counter', 'port', 'airtime', 'data_rate', 'frequency', 'timestamp', 'payload_raw'];

    }
    this.dataSource = new MatTableDataSource(this.DB_VALUES);
    this.loadTable = true;
    this.dataSource.sort = this.sort;
  }


  // displayedColumns = ['id', 'counter', 'payload_raw', 'port', 'airtime', 'data_rate', 'frequency', 'timestamp'];


  convertToCSV(objArray) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = 'id, counter, payload_raw, port, airtime, coding_rate, data_rate, frequency, ' +
      'timestamp, gtw_id, gtw_channel, gtw_rssi, gtw_snr' + '\r\n';

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

  downloadCSV(){

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

