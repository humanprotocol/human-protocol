import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WorkerModule } from './modules/user-worker/worker.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { envValidator } from './common/config/env';
import { OperatorModule } from './modules/operator/operator.module';
import { OperatorController } from './modules/operator/operator.conroller';
import { WorkerController } from './modules/user-worker/worker.controller';

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
    IntegrationsModule,
  ],
  controllers: [AppController, OperatorController, WorkerController],
  providers: [AppService],
  exports: [HttpModule],
})
export class AppModule {}
