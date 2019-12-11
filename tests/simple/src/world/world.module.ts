import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WorldComponent } from './world.component';
import { FooComponent } from 'src/foo/foo.component';

@NgModule({
  declarations: [
    WorldComponent,
    FooComponent
  ],
  providers: [],
  exports: [WorldComponent, FooComponent]
})
export class WorldModule { }
