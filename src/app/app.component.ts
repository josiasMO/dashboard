import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';

declare function connectMQTT(appName, port, key): any;

export interface Values {
  id?: number;
  appName?: string;
  port?: number;
  appKey?: string;
  devices?: any;
}

class ApplicationsDatabase extends Dexie {
  values: Dexie.Table<Values, number>;

  constructor() {
    super('applications');
    this.version(1).stores({
      values: '++id, appName, port, appKey, devices'
    });
  }
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  ready = false;
  constructor(public dialog: MatDialog) {


    const dialogRef = this.dialog.open(DialogFileComponent, {
      height: '450px',
      width: '400px',
      position: {
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
      this.ready = true;
    });

  }


}

@Component({
  selector: 'dialog-file',
  templateUrl: 'dialog-file.html',
  styleUrls: ['./app.component.css']
})
export class DialogFileComponent {

  application: FormGroup;

  validApps = false;
  goBack = false;
  values = [];

  constructor() {
    this.application = new FormGroup({
      appName: new FormControl('', Validators.required),
      port: new FormControl('', Validators.required),
      appKey: new FormControl('', Validators.required)
    });

   this.loadDB();


  }
  loadDB() {
    const db = new ApplicationsDatabase();

    db.transaction('rw', db.values, async() => {
      this.values = await db.values.toArray();
      console.log(JSON.stringify(this.values));
      if (this.values.length > 0) {
        this.validApps = true;
        this.goBack = true;
      }
      else{
        alert('Nenhuma Aplicação Cadastrada');
      }


    }).catch(e => {
      console.log(e.stack || e);
    });

  }
  addApp() {
    this.validApps = false;
  }

  save() {
    const db = new ApplicationsDatabase();

    db.transaction('rw', db.values, async() => {
      const storedValues = await db.values.toArray();
      console.log(storedValues);
      console.log(storedValues.filter(x => x.appName == this.application.value.appName));

      if ((storedValues.filter(x => x.appName == this.application.value.appName)).length == 0) {
        console.log('Adding app');
        const id = await db.values.add({
          appName: this.application.value.appName,
          port: this.application.value.port,
          appKey: this.application.value.appKey,
          devices: []});
        alert('Applicação Adicionada: ' + this.application.value.appName);
        this.loadDB();
      } else {
        alert('Erro! Aplicação ' + this.application.value.appName + ' já existente!!!');
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  }
  itemSelected(appName, port, key) {
    connectMQTT(appName, port, key);
    // alert('Aplicação Selecionada: ' + appName);
  }


}

  //
  // Manipulate and Query Database
  //
//      db.friends.add({name: "Josephine "+value, age: 21}).then(function() {
//        return db.friends.where("age").below(25).toArray();
//      }).then(function (youngFriends) {
//        console.log("My young friends: " + JSON.stringify(youngFriends));
//      }).catch(function (e) {
//        console.log("Error: " + (e.stack || e));
//      });



    // var mapProp = {
    //   center: new google.maps.LatLng(-29.7164666,-53.7170602),
    //   zoom: 15,
    //   mapTypeId: google.maps.MapTypeId.ROADMAP
    // };
    // this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
  // }

  // setMapType(mapTypeId: string) {
  //   this.map.setMapTypeId(mapTypeId)
  // }
  //
  // setCenter() {
  //   this.map.setCenter(new google.maps.LatLng(this.latitude, this.longitude));
  //
  //   let location = new google.maps.LatLng(this.latitude, this.longitude);
  //
  //   let marker = new google.maps.Marker({
  //     position: location,
  //     map: this.map,
  //     title: 'Got you!'
  //   });
  // }


