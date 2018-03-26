import { Component, OnInit, ViewChild } from '@angular/core';
import {MatTableDataSource, MatSort} from '@angular/material';

import Dexie from 'dexie';



export interface Values {
  id?: number;
  counter?: number;
  payload_raw?: string;
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
    super('bufsm');
    this.version(1).stores({
      values: '++id, counter, payload_raw, airtime, coding_rate, data_rate, frequency, timestamp,' +
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


      const DB_VALUES: Values[] = [];
      for (let i = 0; i < storedValues.length; i++){
          DB_VALUES[i] = {id: storedValues[i].id,
            counter: storedValues[i].counter,
            payload_raw: storedValues[i].payload_raw,
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
      console.log(DB_VALUES);
      console.log(ELEMENT_DATA);

      this.dataSource = new MatTableDataSource(DB_VALUES);
      this.loadTable = true;

      this.dataSource.sort = this.sort;

      // Show result:
      // alert ("My young friends: " + JSON.stringify(youngFriends));

    }).catch(e => {
      console.log(e.stack || e);
    });

  }
  displayedColumns = ['id', 'counter', 'payload_raw', 'airtime', 'coding_rate', 'data_rate',
    'frequency', 'timestamp', 'gtw_id', 'gtw_channel', 'gtw_rssi', 'gtw_snr'];

  // displayedColumns = ['position', 'name', 'weight', 'symbol'];

  // dataSource = new MatTableDataSource(ELEMENT_DATA);
  // dataSource:  Object[];
  // dbValues: Object[];




  ngOnInit() {

  }

  ngAfterViewInit() {

  }




}


export interface Element {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: Element[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
  {position: 11, name: 'Sodium', weight: 22.9897, symbol: 'Na'},
  {position: 12, name: 'Magnesium', weight: 24.305, symbol: 'Mg'},
  {position: 13, name: 'Aluminum', weight: 26.9815, symbol: 'Al'},
  {position: 14, name: 'Silicon', weight: 28.0855, symbol: 'Si'},
  {position: 15, name: 'Phosphorus', weight: 30.9738, symbol: 'P'},
  {position: 16, name: 'Sulfur', weight: 32.065, symbol: 'S'},
  {position: 17, name: 'Chlorine', weight: 35.453, symbol: 'Cl'},
  {position: 18, name: 'Argon', weight: 39.948, symbol: 'Ar'},
  {position: 19, name: 'Potassium', weight: 39.0983, symbol: 'K'},
  {position: 20, name: 'Calcium', weight: 40.078, symbol: 'Ca'},
];


