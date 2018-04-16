import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class SharedataService {

  private selectedApp = new BehaviorSubject<string>('');
  currentApp = this.selectedApp.asObservable();

  constructor() { }

  changeApp(selectedApp: string){
    this.selectedApp.next(selectedApp);
  }

}
