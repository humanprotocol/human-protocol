import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JobModule } from './modules/job/job.module';
import { ConfigModule } from '@nestjs/config';
import { envValidator } from './common/config';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    JobModule,
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
