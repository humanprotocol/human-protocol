import { Module } from "@nestjs/common";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { EthersModule } from "nestjs-ethers";

import { AppController } from "./app.controller";
import { DatabaseModule } from "./database/database.module";
import { JwtHttpGuard, RolesGuard } from "./common/guards";
import { HttpValidationPipe } from "./common/pipes";
import { HealthModule } from "./health/health.module";
import { networkMap, networks } from "./common/interfaces/networks";
import { StorageModule } from "./storage/storage.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { TokenModule } from "./token/token.module";

const ethersModules = networks.map(network => {
  return EthersModule.forRoot({
    token: network.key,
    network: network.network,
    custom: network.rpcUrl,
    useDefaultProvider: false,
  });
});

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtHttpGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
  imports: [
    ScheduleModule.forRoot(),
    ...ethersModules,
    EthersModule.forRoot({
      network: networkMap.mumbai.network,
      custom: networkMap.mumbai.rpcUrl,
      useDefaultProvider: false,
    }),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV as string}`,
    }),
    StorageModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UserModule,
    TokenModule
  ],
  controllers: [AppController],
})
export class AppModule {}
