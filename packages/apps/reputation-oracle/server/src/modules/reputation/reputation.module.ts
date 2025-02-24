import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';

import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ReputationController } from './reputation.controller';

@Module({
  imports: [HttpModule, StorageModule, Web3Module],
  controllers: [ReputationController],
  providers: [ReputationService, ReputationRepository],
  exports: [ReputationService],
})
export class ReputationModule {}
