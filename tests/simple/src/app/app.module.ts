import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WorldModule } from 'src/world/world.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    WorldModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
