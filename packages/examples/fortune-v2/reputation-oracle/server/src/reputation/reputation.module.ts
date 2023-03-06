import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { ReputationService } from "./reputation.service";
import { ReputationOracleEntity } from "./reputation-oracle.entity";
import { ReputationWorkerEntity } from "./reputation-worker.entity";
import { ReputationController } from "./reputation.controller";
import { ReputationCron } from "./reputation.cron";
import { StorageModule } from "../storage/storage.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReputationOracleEntity, ReputationWorkerEntity]),
    ConfigModule,
    StorageModule,
    HttpModule,
  ],
  controllers: [ReputationController],
  providers: [Logger, ReputationService, ReputationCron],
  exports: [ReputationService],
})
export class ReputationModule {}
