import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JobModule } from './modules/job/job.module';
import { ConfigModule } from '@nestjs/config';
import { envValidator } from './common/config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    JobModule,
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.env.${process.env.NODE_ENV as string}`
        : '.env',
      validationSchema: envValidator,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '../../../../../',
        'node_modules/swagger-ui-dist',
      ),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
