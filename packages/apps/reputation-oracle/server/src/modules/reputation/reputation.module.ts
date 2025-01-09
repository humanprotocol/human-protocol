import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ReputationService } from './reputation.service';
import { HttpModule } from '@nestjs/axios';
import { ReputationRepository } from './reputation.repository';
import { ReputationController } from './reputation.controller';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [ConfigModule, HttpModule, StorageModule, Web3Module],
  controllers: [ReputationController],
  providers: [Logger, ReputationService, ReputationRepository],
  exports: [ReputationService],
})
export class ReputationModule {}
