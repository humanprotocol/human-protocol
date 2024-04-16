import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';
import { JobRepository } from './job.repository';
import { JobEntity } from './job.entity';
import { WebhookEntity } from '../webhook/webhook.entity';
import { WebhookRepository } from '../webhook/webhook.repository';
import { AssignmentEntity } from '../assignment/assignment.entity';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { SignatureAuthGuard } from '../../common/guards/signature.auth';
import { ROLES_KEY } from '../../common/constant';
import { Role } from '../../common/enums/role';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    TypeOrmModule.forFeature([WebhookEntity]),
    TypeOrmModule.forFeature([AssignmentEntity]),
    ConfigModule,
    HttpModule,
    Web3Module,
    StorageModule,
  ],
  controllers: [JobController],
  providers: [
    JobService,
    JobRepository,
    WebhookRepository,
    AssignmentRepository,
    SignatureAuthGuard,
    {
      provide: ROLES_KEY,
      useValue: [
        Role.Worker,
        Role.JobLauncher,
        Role.Recording,
        Role.Reputation,
      ],
    },
  ],
  exports: [JobService],
})
export class JobModule {}
