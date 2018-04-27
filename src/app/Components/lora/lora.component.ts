import { Component, OnInit, ViewChild } from '@angular/core';
import {MatTableDataSource, MatSort} from '@angular/material';

import Dexie from 'dexie';

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

//
// Declare Database
//
class ValuesDatabase extends Dexie {
  values: Dexie.Table<Values, number>;

  constructor() {
    super('bufsm_bufsm_01');
    this.version(1).stores({
      values: '++id, counter, payload_raw, port, airtime, coding_rate, data_rate, frequency, timestamp,' +
      'gtw_id, gtw_channel, gtw_rssi, gtw_snr'
    });
  }
}


@Component({
  selector: 'app-lora',
  templateUrl: './lora.component.html',
  styleUrls: ['./lora.component.css']
})
export class LoraComponent implements OnInit {

  loadTable: boolean = false;
  dataSource;

  DB_VALUES: Values[] = [];
  @ViewChild(MatSort) sort: MatSort;

  constructor() {

    const db = new ValuesDatabase();

    db.transaction('rw', db.values, async() => {

      // // Make sure we have something in DB:
      // if ((await db.values.where('name').equals('Josephine').count()) === 0) {
      //   let id = await db.friends.add({name: "Josephine", age: 21});
      //   alert (`Addded friend with id ${id}`);
      // }

      // Query:
      let storedValues = await db.values.toArray();
      // console.log(JSON.stringify(storedValues));



      for (let i = 0; i < storedValues.length; i++){
          this.DB_VALUES[i] = {id: storedValues[i].id,
            counter: storedValues[i].counter,
            payload_raw: storedValues[i].payload_raw,
            port: storedValues[i].port,
            airtime: storedValues[i].airtime,
            coding_rate: storedValues[i].coding_rate,
            data_rate: storedValues[i].data_rate,
            frequency: storedValues[i].frequency,
            timestamp: storedValues[i].timestamp,
            gtw_id: storedValues[i].gtw_id,
            gtw_channel: storedValues[i].gtw_channel,
            gtw_rssi: storedValues[i].gtw_rssi,
            gtw_snr: storedValues[i].gtw_snr};
      }
      console.log(this.DB_VALUES);

      let string_msg = Buffer.from(this.DB_VALUES[0].payload_raw, 'base64').toString();
      console.log('Mensagem: -29.' + string_msg.slice(0, 5) + ',  -53.' + string_msg.slice(5));

      this.dataSource = new MatTableDataSource(this.DB_VALUES);
      this.loadTable = true;

      this.dataSource.sort = this.sort;

      // Show result:
      // alert ("My young friends: " + JSON.stringify(youngFriends));

    }).catch(e => {
      console.log(e.stack || e);
    });

  }
  displayedColumns = ['id', 'counter', 'payload_raw', 'port', 'airtime', 'coding_rate', 'data_rate',
    'frequency', 'timestamp', 'gtw_id', 'gtw_channel', 'gtw_rssi', 'gtw_snr'];



  ngOnInit() {

  }

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

