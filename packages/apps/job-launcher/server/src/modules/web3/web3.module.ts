import { Logger, Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [Web3Service, Logger],
  exports: [Web3Service],
})
export class Web3Module {}
