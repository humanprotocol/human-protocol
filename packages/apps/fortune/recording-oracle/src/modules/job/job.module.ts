import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ethereumConfig, storageConfig } from "@/common/config";

import { JobController } from "./job.controller";
import { JobService } from "./job.service";

@Module({
  imports: [ConfigModule.forFeature(ethereumConfig), ConfigModule.forFeature(storageConfig)],
  controllers: [JobController],
  providers: [Logger, JobService],
  exports: [JobService],
})
export class JobModule {}
