import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ReputationService } from './reputation.service';
import { ReputationEntity } from './reputation.entity';
import { HttpModule } from '@nestjs/axios';
import { ReputationRepository } from './reputation.repository';
import { ReputationController } from './reputation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReputationEntity]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [ReputationController],
  providers: [Logger, ReputationService, ReputationRepository],
  exports: [ReputationService],
})
export class ReputationModule {}
