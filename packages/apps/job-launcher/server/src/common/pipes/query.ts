import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { camelCase } from 'lodash';

@Injectable()
export class NormalizeQueryParamsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value !== 'object' || value === null) return value;

    const normalizedQueryParams: any = {};

    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        const camelCaseKey = camelCase(key);
        normalizedQueryParams[camelCaseKey] = value[key];
      }
    }

    return normalizedQueryParams;
  }
}
