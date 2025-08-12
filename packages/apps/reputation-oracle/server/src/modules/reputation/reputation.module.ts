import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { Web3Module } from '@/modules/web3';

import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ReputationController } from './reputation.controller';

@Module({
  imports: [HttpModule, Web3Module],
  controllers: [ReputationController],
  providers: [ReputationService, ReputationRepository],
  exports: [ReputationService],
})
export class ReputationModule {}
