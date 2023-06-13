import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { JwtHttpGuard, RolesGuard } from './common/guards';
import { HttpValidationPipe } from './common/pipes';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { EthersModule } from 'nestjs-ethers';
import { networkMap, networks } from './common/decorators/network';
import { JobModule } from './modules/job/job.module';
import { PaymentModule } from './modules/payment/payment.module';


const ethersModules = networks.map(network => {
  return EthersModule.forRoot({
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
    DatabaseModule,
    HealthModule,
    AuthModule,
    UserModule,
    JobModule,
    PaymentModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
