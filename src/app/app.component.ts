import { Component, OnInit} from '@angular/core';
import { MatDialog } from '@angular/material';
import { Validators, FormControl, FormGroup} from '@angular/forms';

import { SharedataService } from './sharedata.service';

import Dexie from 'dexie';

declare function connectMQTT(app_name, port, app_key): any;

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
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ready = true;
    });

  }

}

@Component({
  selector: 'dialog-file',
  templateUrl: 'dialog-file.html',
  styleUrls: ['./app.component.css'],

})
export class DialogFileComponent implements OnInit{

  selectedApp: string;
  application: FormGroup;
  validApps = false;
  goBack = false;
  values = [];

  constructor(private data: SharedataService) {
    this.application = new FormGroup({
      app_name: new FormControl('', Validators.required),
      port: new FormControl('', Validators.required),
      app_key: new FormControl('', Validators.required)
    });
   this.loadDB();

  }
  ngOnInit(){
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
  }

  loadDB() {
    const db = new ApplicationsDatabase();

    db.transaction('rw', db.values, async() => {
      this.values = await db.values.toArray();
      console.log(JSON.stringify(this.values));
      if (this.values.length > 0) {
        this.validApps = true;
        this.goBack = true;
      } else {
        alert('Nenhuma Aplicação Cadastrada');
      }

    }).catch(e => {
      console.log(e.stack || e);
    });

  }
  addApp() {
    this.application = new FormGroup({
      app_name: new FormControl('', Validators.required),
      port: new FormControl('', Validators.required),
      app_key: new FormControl('', Validators.required)
    });
    this.validApps = false;
  }

  save() {
    const db = new ApplicationsDatabase();

    db.transaction('rw', db.values, async() => {
      const storedValues = await db.values.toArray();

      if ((storedValues.filter(x => x.app_name == this.application.value.app_name)).length === 0) {
        await db.values.add({
          app_name: this.application.value.app_name,
          port: this.application.value.port,
          app_key: this.application.value.app_key,
          devices: []});
        alert('Applicação Adicionada: ' + this.application.value.app_name);
        this.loadDB();
      } else {
        alert('Erro! Aplicação ' + this.application.value.app_name + ' já existente!!!');
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  }
  itemSelected(app_name, port, app_key) {
    this.data.changeApp(app_name);
    connectMQTT(app_name, port, app_key);
  }
}
