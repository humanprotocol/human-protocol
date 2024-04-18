import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';

@Module({
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
