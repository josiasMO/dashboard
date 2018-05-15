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
  validApps = false; // control variable to load HTML
  goBack = false; // enable/disable button Voltar
  values = [];
  app_db = new ApplicationsDatabase();
  old_app = ''; // saves old app_name, in case of change it needs to be updated

  constructor(private data: SharedataService) {
    this.application = new FormGroup({
      app_name: new FormControl('', Validators.required),
      port: new FormControl('', Validators.required),
      app_key: new FormControl('', Validators.required)
    });
   this.loadApps();

  }
  ngOnInit(){
    // subscribe to app name service
    this.data.currentApp.subscribe(selectedApp => this.selectedApp = selectedApp);
  }

  // load apps list
  loadApps() {
    this.app_db.transaction('rw', this.app_db.values, async() => {
      this.values = await this.app_db.values.toArray();
      console.log(JSON.stringify(this.values));
      if (this.values.length > 0) {
        this.validApps = true;
        this.goBack = true;
      } else {
        alert('Nenhuma Aplicação Cadastrada');
        this.addApp();
        this.goBack = false;
      }

    }).catch(e => {
      console.log(e.stack || e);
    });

  }

  deleteButton(app_name) {
    if (confirm('Deseja deletar a aplicação ' + app_name + '?')) {
      this.deleteApp(app_name);
      this.loadApps();
    }
  }

  // delete app_name row from application table
  deleteApp(app_name) {
    this.app_db.transaction('rw', this.app_db.values, async() => {
      let value = await this.app_db.values.where('app_name').equals(app_name).delete();
    }).catch(e => {
      console.log('Erro ao apagar aplicação');
    });
  }

  // edit selected app
  editApp(app_name, port, app_key) {
    if (confirm('Deseja editar a aplicação ' + app_name + '?')) {
      this.old_app = app_name;
      this.application.setValue({
        app_name: app_name,
        port: port,
        app_key: app_key
      });
      this.validApps = false;
    }
  }

  // clear the input form
  addApp() {
    this.application.setValue({
      app_name: '',
      port: '',
      app_key: ''
    });
    this.validApps = false;
  }

  // save new application
  save() {
    this.deleteApp(this.old_app); // verify existence and delete old values from db
    this.old_app = '';

    this.app_db.transaction('rw', this.app_db.values, async() => {
      const storedValues = await this.app_db.values.toArray();

      if ((storedValues.filter(x => x.app_name == this.application.value.app_name)).length === 0) {
        await this.app_db.values.add({
          app_name: this.application.value.app_name,
          port: this.application.value.port,
          app_key: this.application.value.app_key,
          devices: []});
        alert('Applicação Adicionada: ' + this.application.value.app_name);
        this.loadApps();
      } else {
        alert('Erro! Aplicação ' + this.application.value.app_name + ' já existente!!!');
      }
    }).catch(e => {
      console.log(e.stack || e);
    });
  }

  // application selected. Start MQTT connection with TTN
  itemSelected(app_name, port, app_key) {
    this.data.changeApp(app_name);
    connectMQTT(app_name, port, app_key);
  }
}
