import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../job/job.entity';
import { ConfigModule } from '@nestjs/config';
import { AssignmentController } from './assignment.controller';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentRepository } from './assignment.repository';
import { AssignmentService } from './assignment.service';
import { JobRepository } from '../job/job.repository';
import { JobModule } from '../job/job.module';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignmentEntity]),
    TypeOrmModule.forFeature([JobEntity]),
    ConfigModule,
    JobModule,
    Web3Module,
  ],
  controllers: [AssignmentController],
  providers: [AssignmentService, AssignmentRepository, JobRepository],
  exports: [AssignmentService],
})
export class AssignmentModule {}
