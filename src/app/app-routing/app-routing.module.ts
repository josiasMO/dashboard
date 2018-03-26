import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MapComponent } from '../Components/map/map.component';
import { LoraComponent } from '../Components/lora/lora.component';
import { SettingsComponent } from '../Components/settings/settings.component';

const routes: Routes = [
  {
    path: '',
    component: LoraComponent,
  },
  {
    path: 'map',
    component: MapComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    CommonModule
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }


