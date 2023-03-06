import { Module } from "@nestjs/common";

import { StorageService } from "./storage.service";
import { MinioModule } from 'nestjs-minio-client';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MinioModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          endPoint: configService.get('S3_HOST', "127.0.0.1"),
          port: Number(configService.get<number>('S3_PORT', 9000)),
          useSSL: false,
          accessKey: configService.get('S3_ACCESS_KEY', "access-key"),
          secretKey: configService.get('S3_SECRET_KEY', "secrete-key"),
        };
      },
    }),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
