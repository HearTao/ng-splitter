import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'dateTime'})
export class DateTimePipe implements PipeTransform {
  transform(value: number): string {
    return new Date(value).toISOString();
  }
}
