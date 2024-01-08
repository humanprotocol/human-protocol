import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { ConfigModule } from '@nestjs/config';
import { Web3Controller } from './web3.controller';

@Module({
  imports: [ConfigModule],
  providers: [Web3Service],
  exports: [Web3Service],
  controllers: [Web3Controller],
})
export class Web3Module {}
