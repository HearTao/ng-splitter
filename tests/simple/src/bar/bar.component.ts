import { Component } from '@angular/core';
import { PrintService } from 'src/services/print.service';

@Component({
  selector: 'bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.css']
})
export class BarComponent {
  title = 'simple';

  constructor (private printService: PrintService) {

  }
}
