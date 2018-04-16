import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';
import { SharedataService } from '../../sharedata.service';

export interface Values {
  id?: number;
  app_name?: string;
  port?: number;
  app_key?: string;
  devices?: any;
}

class ApplicationsDatabase extends Dexie {
  values: Dexie.Table<Values, number>;

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
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})

export class SettingsComponent implements OnInit{

  app;
  db_app;
  selectedApp: string;
  devices = [];
  packetParts = [];
  dataTypes = ['número', 'string', 'booleano'];

  deviceSelected = false;
  portSelected = false;
  lengthSelected = false;
  packetSelected = false;

  booleanPacket = [];
  isString = [];

  deviceConfig: FormGroup;

  constructor(private data: SharedataService){

    this.deviceConfig = new FormGroup({
      dev_id: new FormControl('', Validators.required),
      port: new FormControl('', [Validators.min(1), Validators.max(255), Validators.required]),
      packet_length: new FormControl('', [Validators.required, Validators.min(1)]),
      packet_parts: new FormControl('', [Validators.required, Validators.min(1)])
    });

  }

  ngOnInit() {
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
    this.loadDevices();

  }


  loadDevices() {

    this.db_app = new ApplicationsDatabase();

    this.db_app.transaction('rw', this.db_app.values, async() => {
      this.app = await this.db_app.values.where('app_name').equals(this.selectedApp).toArray();
      // console.log(this.app);

      this.devices = this.app[0].devices;
      // console.log(this.devices);

    }).catch(e => {
      console.log(e.stack || e);
    });
  }

  changed(change) {
    console.log('Changed: ', change);
    if (change === 'device') {
      this.deviceSelected = true;
    }
    if (change === 'port') {
      if (this.deviceConfig.value.port > 0 && this.deviceConfig.value.port < 256) {
        this.portSelected = true;
      } else {
        this.portSelected = false;
      }
    } else if (change === 'length') {
      if (this.deviceConfig.value.packet_length > 0) {
        this.lengthSelected = true;
      } else {
        this.lengthSelected = false;
      }
    } else if (change === 'packet') {
      if (this.deviceConfig.value.packet_parts > 0) {
        this.packetParts  = [];
        for (let i = 0; i < this.deviceConfig.value.packet_parts; i++) {
          this.booleanPacket[i] = false;
          this.packetParts[i] = new FormGroup({
            fieldname: new FormControl('', Validators.required),
            data_type: new FormControl('', Validators.required),
            start_bit: new FormControl('', [Validators.required, Validators.min(0)]),
            end_bit: new FormControl(''),
            scale: new FormControl('')
          });
        }
        this.packetSelected = true;
      } else {
        this.packetSelected = false;
      }
    }

    console.log(this.deviceConfig.value);
  }
  checkType(data_type, i) {
    console.log('Tipo de dado: ', data_type.value);
    if (data_type.value === 'booleano'){
      this.booleanPacket[i] = true;
    } else {
      this.booleanPacket[i] = false;
    }
    if (data_type.value === 'string'){
      this.isString[i] = true;
    }
    else {
      this.isString[i] = false;
    }
  }

  save() {

    let valid_rows = true;
    let packet_parts = [];
    for(let i = 0; i< this.packetParts.length; i++){
      if (!this.packetParts[i].valid){
        alert('Campo Inválido na Linha ' + i + 1);
        valid_rows = false;
      } else {
          packet_parts[i] = this.packetParts[i].value;
      }
    }

    if (valid_rows) {

      const parts_db = new PartsDatabase();

      for (let i = 0; i < packet_parts.length; i++) {
        parts_db.transaction('rw', parts_db.values, async() => {

         await parts_db.values.put({
            app_name: this.selectedApp,
            dev_id: this.deviceConfig.value.dev_id,
            port: this.deviceConfig.value.port,
            parts: packet_parts});

         const dbparts = await parts_db.values.toArray();
         console.log('Db_parts: ', dbparts);

        }).catch(e => {
          console.log(e.stack || e);
        });
      }

      // const index = (this.app[0].devices).findIndex(item => item.dev_id === this.deviceConfig.value.dev_id);

      // this.app[0].devices[index].ports[this.deviceConfig.value.port] = {
      //   'port_num': this.deviceConfig.value.port,
      //   'packet_length': this.deviceConfig.value.packet_length,
      //   'parts': packet_parts};

      // console.log(this.app[0]);

      // this.db_app.transaction('rw', this.db_app.values, async() => {
      //   this.db_app.values.where('app_name').equals(this.selectedApp).modify(this.app[0]);
      //   this.app = await this.db_app.values.where('app_name').equals(this.selectedApp).toArray();
      //   console.log(this.app[0]);
      //   for (let i = 0; i < this.app[0].devices.length; i++){
      //     this.devices[i] = this.app[0].devices[i].dev_id;
      //   }
      //   console.log(this.devices);
      //
      // }).catch(e => {
      //   console.log(e.stack || e);
      // });

    }

  }
}
