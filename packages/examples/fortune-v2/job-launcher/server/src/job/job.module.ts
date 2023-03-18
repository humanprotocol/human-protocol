import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { JobService } from "./job.service";
import { JobEntity } from "./job.entity";
import { JobController } from "./job.controller";
import { JobCron } from "./job.cron";
import { StorageModule } from "../storage/storage.module";
import { HttpModule } from "@nestjs/axios";
import { PaymentModule } from "../payment/payment.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    ConfigModule,
    StorageModule,
    HttpModule,
    PaymentModule
  ],
  controllers: [JobController],
  providers: [Logger, JobService, JobCron],
  exports: [JobService],
})
export class JobModule {}
