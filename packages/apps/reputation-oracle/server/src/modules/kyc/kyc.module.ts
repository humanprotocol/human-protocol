import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserModule } from '../user/user.module';
import { KYCService } from './kyc.service';
import { KYCController } from './kyc.controller';

@Module({
  imports: [UserModule, ConfigModule, HttpModule],
  providers: [KYCService],
  controllers: [KYCController],
  exports: [KYCService],
})
export class KYCModule {}
