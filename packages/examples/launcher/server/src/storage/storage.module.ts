import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { StorageService } from "./storage.service";
import { s3Provider } from "../common/providers";

@Module({
  imports: [ConfigModule],
  providers: [s3Provider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
