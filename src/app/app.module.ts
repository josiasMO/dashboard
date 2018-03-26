import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Routes, RouterModule } from '@angular/router';
import { NgModule} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule,
  MatCheckboxModule,
  MatToolbarModule,
  MatButtonModule,
  MatMenuModule,
  MatIconModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatTooltipModule,
  MatTableModule,
  MatSortModule} from '@angular/material';

import { FlexLayoutModule } from '@angular/flex-layout';
import {CdkTableModule} from '@angular/cdk/table';

import { AppComponent } from './app.component';
import { HeaderComponent } from './Components/header/header.component';
import { MapComponent } from './Components/map/map.component';
import { LoraComponent } from './Components/lora/lora.component';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { SettingsComponent } from './Components/settings/settings.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MapComponent,
    LoraComponent,
    SettingsComponent

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    AppRoutingModule,
    FlexLayoutModule,
    CdkTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
