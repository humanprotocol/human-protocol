import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Web3Service } from "./web3.service";
import { ethereumConfig } from "@/common/config";

@Module({
  imports: [ConfigModule.forFeature(ethereumConfig)],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
