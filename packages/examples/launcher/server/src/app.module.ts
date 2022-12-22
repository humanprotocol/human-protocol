import { Module } from "@nestjs/common";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { EthersModule, MUMBAI_NETWORK } from 'nestjs-ethers';

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { JwtHttpGuard, RolesGuard } from "./common/guards";
import { UserModule } from "./user/user.module";
import { HttpValidationPipe } from "./common/pipes";
import { JobModule } from "./job/job.module";
import { HealthModule } from "./health/health.module";

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
    EthersModule.forRoot({
      network: MUMBAI_NETWORK,
      alchemy: process.env.ALCHEMY_ACCESS_KEY as string,
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
