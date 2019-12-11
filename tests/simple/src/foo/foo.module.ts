import { NgModule } from '@angular/core';

import { FooComponent } from './foo.component';

@NgModule({
  declarations: [
    FooComponent
  ],
  providers: [],
  exports: [FooComponent]
})
export class FooModule { }
