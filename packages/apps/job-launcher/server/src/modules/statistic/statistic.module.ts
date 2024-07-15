import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { StatisticService } from './statistic.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity])],
  providers: [StatisticService, JobRepository],
  controllers: [StatisticController],
  exports: [StatisticService],
})
export class StatisticModule {}
