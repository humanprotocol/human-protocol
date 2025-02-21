import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Web3Service } from './web3.service';

@Module({
  imports: [ConfigModule],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
