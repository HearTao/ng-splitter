import { Component } from '@angular/core';
import { PrintService } from 'src/services/print.service';

@Component({
  selector: 'hello-world',
  templateUrl: './world.component.html',
  styleUrls: ['./world.component.css']
})
export class WorldComponent {
  constructor(private printService: PrintService) {

  }

  title = 'simple';
}
