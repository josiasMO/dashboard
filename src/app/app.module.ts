import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

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
  MatSortModule,
  MatDialogModule,
  MatListModule } from '@angular/material';

import {CdkTableModule} from '@angular/cdk/table';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import { AppComponent , DialogFileComponent } from './app.component';
import { HeaderComponent } from './Components/header/header.component';
import { MapComponent } from './Components/map/map.component';
import { LoraComponent } from './Components/lora/lora.component';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { SettingsComponent } from './Components/settings/settings.component';
import { ApplicationComponent } from './Components/application/application.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MapComponent,
    LoraComponent,
    SettingsComponent,
    ApplicationComponent,
    DialogFileComponent

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
    MatDialogModule,
    MatListModule,
    AppRoutingModule,
    NgbModule.forRoot(),
    CdkTableModule
  ],
  entryComponents: [AppComponent, DialogFileComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
