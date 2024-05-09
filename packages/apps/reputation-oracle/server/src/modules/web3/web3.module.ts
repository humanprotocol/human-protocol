import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { ConfigModule } from '@nestjs/config';
import { Web3Controller } from './web3.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [Web3Service],
  exports: [Web3Service],
  controllers: [Web3Controller],
})
export class Web3Module {}
