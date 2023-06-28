import { HttpModule } from "@nestjs/axios";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { storageConfig } from "@/common/config";
import { JobController } from "./job.controller";
import { JobService } from "./job.service";
import { Web3Module } from "../web3/web3.module";

@Module({
  imports: [ConfigModule.forFeature(storageConfig), HttpModule, Web3Module],
  controllers: [JobController],
  providers: [Logger, JobService],
  exports: [JobService],
})
export class JobModule {}
