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

  //variables that control readonly of forms
  deviceSelected = false;
  portSelected = false;
  loadTable = false;

  DB_VALUES: Values[] = [];
  @ViewChild(MatSort) sort: MatSort;

  constructor(private data: SharedataService) {

    this.deviceConfig = new FormGroup({
      dev_id: new FormControl('', Validators.required),
      port: new FormControl('', [Validators.min(1), Validators.max(255), Validators.required]),
    });

  }

  displayedColumns = ['id', 'counter', 'port', 'airtime', 'data_rate', 'frequency', 'timestamp', 'payload_raw'];


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
        this.load_data_device();
      } else {
        this.portSelected = false;
      }
    }
  }

  load_data_device() {

    const db = new ValuesDatabase(this.selectedApp + '_' + this.deviceConfig.value.dev_id);

    db.transaction('rw', db.values, async() => {
      let storedValues = await db.values.where('port').equals(this.deviceConfig.value.port).toArray();
      // console.log(JSON.stringify(storedValues));

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
      this.load_port_parts();
      let string_msg = Buffer.from(this.DB_VALUES[0].payload_raw, 'base64').toString();
      console.log('Mensagem: -29.' + string_msg.slice(0, 5) + ',  -53.' + string_msg.slice(5));
      console.log('Bits: ' +  this.DB_VALUES[0].payload_raw.charCodeAt(0).toString(2));

      this.dataSource = new MatTableDataSource(this.DB_VALUES);
      this.loadTable = true;

      this.dataSource.sort = this.sort;


    }).catch(e => {
      console.log(e.stack || e);
    });
  };

  load_port_parts(){
    const db_parts = new PartsDatabase();
    db_parts.transaction('rw', db_parts.values, async() => {
      let storedValues = await db_parts.values.where('[app_name+dev_id+port]').equals([this.selectedApp,
        this.deviceConfig.value.dev_id, this.deviceConfig.value.port]).toArray();
      console.log('Parts: ', JSON.stringify(storedValues));

    }).catch(e => {
      console.log(e.stack || e);
    });
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

