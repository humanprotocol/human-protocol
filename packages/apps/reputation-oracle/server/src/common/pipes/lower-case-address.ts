import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class LowerCaseAddressPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (key === 'address' && typeof value[key] === 'string') {
          value[key] = value[key].toLowerCase();
        }
      }
    }
    return value;
  }
}
