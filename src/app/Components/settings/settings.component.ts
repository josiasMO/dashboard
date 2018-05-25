import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';
import { SharedataService } from '../../sharedata.service';

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


//Model of Parts database
export interface Parts {
  id?: number;
  app_name?: string;
  dev_id?: string;
  lat: number;
  lng: number;
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

  selectedApp: string;
  devices = [];
  packetParts = [];
  dataTypes = ['número', 'string', 'booleano'];
  db_device: DevicesDatabase;

  //variables that control readonly of forms
  deviceSelected = false;
  portSelected = false;
  packetSelected = false;
  divisionValue;
  coordinatesChanged = false;

  //variables that hide/show fields end_bit and/or scale
  booleanPacket = [];
  isString = [];

  deviceConfig: FormGroup;
  payload_fields: true;

  constructor(private data: SharedataService) {

    // Creates top form inputs for device_id, port and number of parts
    this.deviceConfig = new FormGroup({
      dev_id: new FormControl('', Validators.required),
      lat: new FormControl('', Validators.required),
      lng: new FormControl('', Validators.required),
      port: new FormControl('', [Validators.min(1), Validators.max(255), Validators.required]),
      packet_parts: new FormControl('', [Validators.required, Validators.min(1)]),
      payload_fields: new FormControl(null, Validators.required)
    });

  }

  ngOnInit() {
    // subscribe to service to retrieve app name
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
    this.loadDevices();

  }

  // load list of devices from the current application and add them to drop down menu
  loadDevices() {
    this.db_device = new DevicesDatabase();
    this.db_device.transaction('rw', this.db_device.values, async() => {
      const devs = await this.db_device.values.where('[app_name+dev_id]').between(
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

  // check if the port was previous initialized
  verifyPort() {
    const parts_db = new PartsDatabase();
    parts_db.transaction('rw', parts_db.values, async() => {
      const dbparts = await parts_db.values
        .where('[app_name+dev_id+port]')
        .equals([this.selectedApp, this.deviceConfig.value.dev_id, this.deviceConfig.value.port]).toArray();

      // load the results into the input forms
      this.divisionValue = dbparts[0].parts.length;
      this.deviceConfig.value.packet_parts = dbparts[0].parts.length;

      this.changed('packet', dbparts[0].parts);

    }).catch(e => {
      console.log('Porta não cadastrada!');
      this.packetSelected = false;
      this.deviceConfig.patchValue({packet_parts: ''});
      // console.log(e.stack || e);
    });

  }

  // verify modifications in the input forms, to enable/disable form fields.
  changed(change, parts=null) {
    if (change === 'device') {
      this.deviceSelected = true; // enables port form field

      // reset values of port and parts
      this.deviceConfig.patchValue({port: '', packet_parts: ''});
      // this.deviceConfig.setValue({lat: dbparts[0].lat, lng: dbparts[0].lng});
      this.portSelected = false;
      this.packetSelected = false;
    }
    if (change === 'port') {
      // Verify if port is valid
      if (this.deviceConfig.value.port > 0 && this.deviceConfig.value.port < 256) {
        this.portSelected = true; // enables packet_part form field
        this.verifyPort(); // verify if port was previously saved
      } else {
        this.portSelected = false;
      }
    } else if (change === 'packet') {
      if (this.deviceConfig.value.packet_parts > 0) {
        this.packetParts  = [];
        // create a vector of forms with the input packet_parts
        for (let i = 0; i < this.deviceConfig.value.packet_parts; i++) {
          this.booleanPacket[i] = false;
          this.packetParts[i] = new FormGroup({
            fieldname: new FormControl('', Validators.required),
            data_type: new FormControl('', Validators.required),
            start_bit: new FormControl('', [Validators.required, Validators.min(0)]),
            end_bit: new FormControl(''),
            scale: new FormControl(''),
            offset: new FormControl('')
          });
          // load the values previously saved in the IndexedDB
          if (parts) {
            this.packetParts[i].setValue({
              fieldname: parts[i].fieldname,
              data_type: parts[i].data_type,
              start_bit: parts[i].start_bit,
              end_bit: parts[i].end_bit,
              scale: parts[i].scale,
              offset: parts[i].offset
            });

            // hide, if necessary, the forms end_bit and/or scale
            if (parts[i].data_type === 'booleano') {
              this.booleanPacket[i] = true;
            } else {
              this.booleanPacket[i] = false;
            }
            if (parts[i].data_type === 'string') {
              this.isString[i] = true;
            } else {
              this.isString[i] = false;
            }
          }
        }
        this.packetSelected = true; //Show the Parts inputs forms
      } else {
        this.packetSelected = false;
      }
    }
    if (change === 'lat' || change === 'lng') {
      this.coordinatesChanged = true;
    }
  }

  // hide, if necessary, the forms end_bit and/or scale (Called from HTML)
  checkType(data_type, i) {
    // console.log('Tipo de dado: ', data_type.value);
    if (data_type.value === 'booleano'){
      this.booleanPacket[i] = true;
    } else {
      this.booleanPacket[i] = false;
    }
    if (data_type.value === 'string'){
      this.isString[i] = true;
    } else {
      this.isString[i] = false;
    }
  }

  // save the parts that were inserted by user
  saveParts() {

    let packet_parts = [];

    // verify if all the forms were filled correctly
    let valid_rows = true;
    for (let i = 0; i< this.packetParts.length; i++){
      if (!this.packetParts[i].valid){
        alert('Campo Inválido na Linha ' + i + 1);
        valid_rows = false;
      } else {
          packet_parts[i] = this.packetParts[i].value;
      }
    }

    // if all forms were filled correctly.
    if (valid_rows) {
      const parts_db = new PartsDatabase();

      // Insert a object for each packet part
      for (let i = 0; i < packet_parts.length; i++) {
        parts_db.transaction('rw', parts_db.values, async() => {
          await parts_db.values.put({
            app_name: this.selectedApp,
            dev_id: this.deviceConfig.value.dev_id,
            port: this.deviceConfig.value.port,
            parts: packet_parts});


        }).catch(e => {
          console.log('Erro inserindo tabela');
        });
      }
      alert('Configuração da porta ' + this.deviceConfig.value.port + ' salva com sucesso');
    }
  }
  saveCoordinates() {

    this.db_device.transaction('rw', this.db_device.values, async() => {
      console.log('Salvando Coordenadas');
      await this.db_device.values.put({
        app_name: this.selectedApp,
        dev_id: this.deviceConfig.value.dev_id,
        lat: this.deviceConfig.value.lat,
        lng: this.deviceConfig.value.lng});

      const dbdev = await this.db_device.values.toArray();
      console.log('Devices Registered: ', dbdev);

    }).catch(e => {
      console.log('Erro inserindo tabela DEVICES');
    });


  }
}
