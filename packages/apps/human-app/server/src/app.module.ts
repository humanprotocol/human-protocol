import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthWorkerModule } from './modules/auth-worker/auth-worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath: '.env', isGlobal: true}),
    HttpModule,
    AuthWorkerModule
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [HttpModule]
})
export class AppModule {}
