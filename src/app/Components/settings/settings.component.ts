import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';
import { SharedataService } from '../../Services/sharedata.service';

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
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})

export class SettingsComponent implements OnInit{

  selectedApp: string;
  devices = [];
  devices_list = [];
  packetParts = [];
  dataTypes = ['número', 'string', 'booleano'];
  db_device: DevicesDatabase;
  parts_db: PartsDatabase;


  //variables that control readonly of forms
  deviceSelected = false;
  portSelected = false;
  packetSelected = false;
  divisionValue;
  coordinatesChanged = false;
  payloadChanged = false;

  //variables that hide/show fields end_bit and/or scale
  booleanPacket = [];
  isString = [];

  deviceConfig: FormGroup;
  payload_fields: boolean;

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
    this.parts_db = new PartsDatabase();
    this.loadDevices();
    this.payload_fields = false;

  }

  // load list of devices from the current application and add them to drop down menu
  loadDevices() {
    this.db_device = new DevicesDatabase();
    this.db_device.transaction('rw', this.db_device.values, async() => {
      this.devices = await this.db_device.values.where('[app_name+dev_id]').between(
        [this.selectedApp, Dexie.minKey], [this.selectedApp, Dexie.maxKey]).toArray();
      this.devices_list = [];
      for (let dev of this.devices) {
        this.devices_list.push(dev.dev_id);
      }
      // console.log('Devices: ', this.devices_list);
    }).catch(e => {
      console.log(e.stack || e);
    });
    }

  // check if the port was previous initialized
  verifyPort() {
    this.parts_db.transaction('rw', this.parts_db.values, async() => {
      const dbparts = await this.parts_db.values
        .where('[app_name+dev_id+port]')
        .equals([this.selectedApp, this.deviceConfig.value.dev_id, this.deviceConfig.value.port]).toArray();

      // load the results into the input forms

      console.log('Db_parts: ', dbparts[0]);
      this.payload_fields = dbparts[0].payload_fields;
      this.divisionValue = dbparts[0].parts.length;
      this.deviceConfig.value.packet_parts = dbparts[0].parts.length;
      this.changed('packet', dbparts[0].parts);

    }).catch(e => {
      this.deviceConfig.patchValue({packet_parts: null});
      // console.log('Porta não cadastrada!');
      this.payload_fields = false;
      this.packetSelected = false;
    });

  }

  // verify modifications in the input forms, to enable/disable form fields.
  changed(change, parts=null) {
    if (change === 'device') {
      let dev =  this.devices.filter(x => x.dev_id === this.deviceConfig.value.dev_id)[0];
      // console.log('Selected Device: ', dev);
      this.deviceSelected = true; // enables port form field
      // reset values of port and parts
      this.deviceConfig.patchValue({port: '', packet_parts: '', lat: dev.lat, lng: dev.lng});
      // this.deviceConfig.setValue({lat: dbparts[0].lat, lng: dbparts[0].lng});
      this.portSelected = false;
      this.packetSelected = false;
    }
    if (change === 'port') {
      this.payloadChanged = false;
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
    if (change === 'payload_fields'){
      // console.log('Changed Payload Fields', this.payload_fields);
      if (!this.payload_fields) {
        this.portSelected = true;
        // this.changed('port');
      }
      this.payloadChanged = true;

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
      this.parts_db.transaction('rw', this.parts_db.values, async() => {
        await this.parts_db.values.put({
          app_name: this.selectedApp,
          dev_id: this.deviceConfig.value.dev_id,
          port: this.deviceConfig.value.port,
          payload_fields: this.payload_fields,
          parts: packet_parts});


      }).catch(e => {
        console.log('Erro inserindo tabela');
      });
      alert('Configuração da porta ' + this.deviceConfig.value.port + ' salva com sucesso');
    } else {
      this.parts_db.transaction('rw', this.parts_db.values, async() => {
        await this.parts_db.values.put({
          app_name: this.selectedApp,
          dev_id: this.deviceConfig.value.dev_id,
          port: this.deviceConfig.value.port,
          payload_fields: this.payload_fields,
          parts: ''});


      }).catch(e => {
        console.log('Erro inserindo tabela');
      });
    }
  }

  saveCoordinates() {

    this.db_device.transaction('rw', this.db_device.values, async() => {
      // console.log('Salvando Coordenadas');
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
