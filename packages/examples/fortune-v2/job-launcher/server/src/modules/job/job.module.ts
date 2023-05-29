import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { JobService } from "./job.service";
import { JobEntity } from "./job.entity";
import { JobController } from "./job.controller";
import { JobCron } from "./job.cron";
import { HttpModule } from "@nestjs/axios";
import { PaymentModule } from "../payment/payment.module";
import { JobRepository } from "./job.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    ConfigModule,
    HttpModule,
    PaymentModule
  ],
  controllers: [JobController],
  providers: [Logger, JobService, JobRepository, JobCron],
  exports: [JobService],
})
export class JobModule {}
