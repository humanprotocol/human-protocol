import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthWorkerModule } from './modules/auth-worker/auth-worker.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    HttpModule,
    AuthWorkerModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [HttpModule],
})
export class AppModule {}
