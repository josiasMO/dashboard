import { Component, OnInit, ViewChild } from '@angular/core';
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

//Model of Devices database
export interface Gateways{
  gtw_id?: string;
  alt: number;
  lat: number;
  lng: number;
}

class GatewaysDatabase extends Dexie {
  values: Dexie.Table<Gateways, number>;

  constructor() {
    super('gateways');
    this.version(1).stores({
      values: 'gtw_id, alt, lat, lng'
    });
  }
}


// just an interface for type safety.
interface marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  title = 'Map';
  zoom = 12;
  lat = -29.7158273;
  lng = -53.720218;

  selectedApp: string;
  devices = [];
  gateways = [];
  markers_devices = [];
  markers_gateways = [];


  clickedMarker(label: string, index: number) {
    console.log(`clicked the marker: ${label || index}`)
  }

  constructor(private data: SharedataService) { }

  ngOnInit() {
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
    this.load_devices();
    this.load_gateways();
  }

  load_devices() {
    const db_device = new DevicesDatabase();
    db_device.transaction('rw', db_device.values, async() => {
      this.devices = await db_device.values.where('[app_name+dev_id]').between(
        [this.selectedApp, Dexie.minKey], [this.selectedApp, Dexie.maxKey]).toArray();
      for (let i = 0; i < this.devices.length; i++){
        this.markers_devices.push({
          label: this.devices[i].dev_id,
          lat: this.devices[i].lat,
          lng: this.devices[i].lng,
          draggable: false
        });
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  }

  load_gateways() {
    const db_gateways = new GatewaysDatabase();
    db_gateways.transaction('rw', db_gateways.values, async() => {
      this.gateways = await db_gateways.values.toArray();
      for (let i = 0; i < this.gateways.length; i++){
        let label = 'Gateway ' + (i + 1);
        this.markers_gateways.push({
          label: label,
          lat: this.gateways[i].lat,
          lng: this.gateways[i].lng,
          draggable: false
        });
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  }


}
