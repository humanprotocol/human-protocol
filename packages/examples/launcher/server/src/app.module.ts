import { Module } from "@nestjs/common";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { EthersModule, GOERLI_NETWORK, MAINNET_NETWORK, MATIC_NETWORK, MUMBAI_NETWORK, RINKEBY_NETWORK } from 'nestjs-ethers';

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { JwtHttpGuard, RolesGuard } from "./common/guards";
import { UserModule } from "./user/user.module";
import { HttpValidationPipe } from "./common/pipes";
import { JobModule } from "./job/job.module";
import { HealthModule } from "./health/health.module";
import { networkMap, networks } from "./job/interfaces/network";

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
    AuthModule,
    DatabaseModule,
    HealthModule,
    UserModule,
    JobModule,
  ],
  controllers: [AppController],
})
export class AppModule {}