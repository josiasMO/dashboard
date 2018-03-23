import { Component, Input, OnInit } from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

import Dexie from 'dexie';


interface Values {
  id?: number;
  type?: string;
  value?: number;
}

//
// Declare Database
//
class ValuesDatabase extends Dexie {
  values: Dexie.Table<Values, number>;

  constructor() {
    super('rhf76052_values');
    this.version(1).stores({
      values: '++id,type,value'
    });
  }
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

export class HeaderComponent implements OnInit {


  clickedButton(msg){
    alert("Clicked "+ msg);
  }
  @Input() title: string;

  clickMessage = '';

  onClickMe() {

    const db = new ValuesDatabase();

    db.transaction('rw', db.values, async() => {

      // // Make sure we have something in DB:
      // if ((await db.values.where('name').equals('Josephine').count()) === 0) {
      //   let id = await db.friends.add({name: "Josephine", age: 21});
      //   alert (`Addded friend with id ${id}`);
      // }

      // Query:
      let storedValues = await db.values.toArray();
      this.clickMessage = JSON.stringify(storedValues);

      // Show result:
      // alert ("My young friends: " + JSON.stringify(youngFriends));

    }).catch(e => {
      console.log(e.stack || e);
    });

    // const db = new Dexie('rhf76052_values');
    // db.version(1).stores({
    //   values: '++id,type,value'
    // });
    //
    // db.values.add({type: "Potência", value: receivedValue}).then(function() {
    //   return db.values.toArray();
    // }).then(function (storedValues) {
    //   this.clickMessage = JSON.stringify(storedValues);
    //     //console.log('Valores' + JSON.stringify(storedValues));
    // }).catch(function (e) {
    //   console.log('Error: ' + (e.stack || e));
    // });
    // '' 'You are my hero!';
  }


  // constructor() { }

  ngOnInit() {
  }

}




