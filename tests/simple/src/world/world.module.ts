import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WorldComponent } from './world.component';

@NgModule({
  declarations: [
    WorldComponent
  ],
  providers: [],
  exports: [WorldComponent]
})
export class WorldModule { }
