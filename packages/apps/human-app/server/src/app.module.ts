import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WorkerModule } from './modules/user-worker/worker.module';
import { ReputationOracleModule } from './integrations/reputation-oracle/reputation-oracle.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { envValidator } from './common/config/environment-config.service';
import { OperatorModule } from './modules/user-operator/operator.module';
import { OperatorController } from './modules/user-operator/operator.controller';
import { WorkerController } from './modules/user-worker/worker.controller';
import { CommonConfigModule } from './common/config/common-config.module';
import { CacheFactoryConfig } from './common/config/cache-factory.config';
import { CacheModule } from '@nestjs/cache-manager';
import { OracleDiscoveryController } from './modules/oracle-discovery/oracle-discovery.controller';
import { OracleDiscoveryModule } from './modules/oracle-discovery/oracle-discovery.module';
import { JobsDiscoveryModule } from './modules/jobs-discovery/jobs-discovery.module';
import { JobsDiscoveryController } from './modules/jobs-discovery/jobs-discovery.controller';
import { JobAssignmentController } from './modules/job-assignment/job-assignment.controller';
import { JobAssignmentModule } from './modules/job-assignment/job-assignment.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { StatisticsController } from './modules/statistics/statistics.controller';
import { ExchangeOracleModule } from './integrations/exchange-oracle/exchange-oracle.module';

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
    CacheModule.registerAsync(CacheFactoryConfig),
    HttpModule,
    WorkerModule,
    OperatorModule,
    JobsDiscoveryModule,
    JobAssignmentModule,
    ReputationOracleModule,
    ExchangeOracleModule,
    CommonConfigModule,
    OracleDiscoveryModule,
    StatisticsModule,
  ],
  controllers: [
    AppController,
    OperatorController,
    WorkerController,
    JobsDiscoveryController,
    OracleDiscoveryController,
    JobAssignmentController,
    StatisticsController,
  ],
  exports: [HttpModule],
})
export class AppModule {}
