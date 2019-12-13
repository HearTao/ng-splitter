import { NgModule } from '@angular/core';

import { WorldComponent } from './world.component';
import { FooComponent } from 'src/foo/foo.component';
import { ExponentialStrengthPipe } from 'src/pipes/exponential-strength.pipe';
import { DateTimePipe } from 'src/pipes/date-time.pipe';

@NgModule({
  declarations: [
    WorldComponent,
    FooComponent,
    ExponentialStrengthPipe,
    DateTimePipe
  ],
  providers: [],
  exports: [WorldComponent, FooComponent]
})
export class WorldModule { }
