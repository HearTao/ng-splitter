import { NgModule } from '@angular/core';

import { WorldComponent } from './world.component';
import { FooComponent } from 'src/foo/foo.component';
import { ExponentialStrengthPipe } from 'src/pipes/exponential-strength.pipe';
import { DateTimePipe } from 'src/pipes/date-time.pipe';
import { BarComponent } from 'src/bar/bar.component';

@NgModule({
  declarations: [
    WorldComponent,
    FooComponent,
    BarComponent,
    ExponentialStrengthPipe,
    DateTimePipe
  ],
  providers: [],
  exports: [WorldComponent, FooComponent, BarComponent]
})
export class WorldModule { }
