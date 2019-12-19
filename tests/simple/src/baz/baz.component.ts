import { Component } from '@angular/core';
import { PrintService } from 'src/services/print.service';

@Component({
  selector: 'baz',
  templateUrl: './baz.component.html',
  styleUrls: ['./baz.component.css']
})
export class BazComponent {
  title = 'simple';

  constructor (private printService: PrintService) {

  }
}
