import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { TimelogViewComponent } from './timelog-view/timelog-view.component';
import { RoundPipe } from './round-pipe';


@NgModule({
  declarations: [
    AppComponent,
    TimelogViewComponent,
    RoundPipe
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
