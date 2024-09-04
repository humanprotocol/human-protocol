import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class AddressValidationPipe implements PipeTransform {
  transform(value: string) {
    if (!ethers.isAddress(value)) {
      throw new BadRequestException('Invalid address');
    }
    return value;
  }
}
