import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { ConfigModule } from '@nestjs/config';
import { web3Config } from '../../common/config';

@Module({
  imports: [ConfigModule.forFeature(web3Config)],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
