import { Component, OnInit } from '@angular/core';
// import { Validators, FormControl, FormGroup} from '@angular/forms';

import Dexie from 'dexie';


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
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})

export class SettingsComponent implements OnInit {

  // application: FormGroup;

  constructor(){
    // this.application = new FormGroup({
    //   appName: new FormControl('', Validators.required),
    //   port: new FormControl('', Validators.required),
    //   appKey: new FormControl('', Validators.required)
    // });
  }
  ngOnInit() {
  }

  // save() {
  //   const db = new ApplicationsDatabase();
  //
  //   db.transaction('rw', db.values, async() => {
  //     let storedValues = await db.values.toArray();
  //     console.log(storedValues);
  //     console.log(storedValues.filter(x => x.appName == this.application.value.appName))
  //
  //     if ((storedValues.filter(x => x.appName == this.application.value.appName)).length == 0) {
  //       let id = await db.values.add({
  //         appName: this.application.value.appName,
  //         port: this.application.value.port,
  //         appKey: this.application.value.appKey,
  //         devices: []});
  //       alert('Applicação Adicionada: ' + this.application.value.appName);
  //     }
  //     else {
  //       alert('Erro! Aplicação ' + this.application.value.appName + ' já existente!!!');
  //     }
  //   }).catch(e => {
  //     console.log(e.stack || e);
  //   });
  //
  //
  // }

}
