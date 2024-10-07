import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QualificationService } from './qualification.service';
import { QualificationController } from './qualification.controller';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [ConfigModule, HttpModule, Web3Module],
  providers: [Logger, QualificationService],
  controllers: [QualificationController],
  exports: [QualificationService],
})
export class QualificationModule {}
