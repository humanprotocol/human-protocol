import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentEntity } from '../assignment/assignment.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { AssignmentRepository } from '../assignment/assignment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AssignmentEntity])],
  controllers: [StatsController],
  providers: [StatsService, AssignmentRepository],
  exports: [StatsService],
})
export class StatsModule {}
