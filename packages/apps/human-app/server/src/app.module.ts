import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WorkerModule } from './modules/user-worker/worker.module';
import { ReputationOracleModule } from './integrations/reputation-oracle/reputation-oracle.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { envValidator } from './common/config/environment-config.service';
import { OperatorModule } from './modules/operator/operator.module';
import { OperatorController } from './modules/operator/operator.conroller';
import { WorkerController } from './modules/user-worker/worker.controller';
import { AppConfigModule } from './common/config/app-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validationSchema: envValidator,
    }),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    HttpModule,
    WorkerModule,
    OperatorModule,
    ReputationOracleModule,
    AppConfigModule,
  ],
  controllers: [AppController, OperatorController, WorkerController],
  providers: [AppService],
  exports: [HttpModule],
})
export class AppModule {}
