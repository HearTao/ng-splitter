import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WorldModule } from 'src/world/world.module';
import { PrintService } from 'src/services/print.service';
import { HeroService } from 'src/services/hero.service';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    WorldModule
  ],
  providers: [
    PrintService,
    HeroService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
