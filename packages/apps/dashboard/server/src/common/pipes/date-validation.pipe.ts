import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class DateValidationPipe implements PipeTransform {
  private readonly dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  transform(value: string) {
    if (typeof value === 'string' && !this.dateRegex.test(value)) {
      throw new BadRequestException(
        `Validation failed. Value must be in the format YYYY-MM-DD.`,
      );
    }
    return value;
  }
}
