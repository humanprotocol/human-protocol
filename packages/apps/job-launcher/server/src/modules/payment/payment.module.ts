import { Module } from '@nestjs/common';

import { PaymentService } from './payment.service';
import { MinioModule } from 'nestjs-minio-client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentEntity } from './payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { RateService } from './rate.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([PaymentEntity]),
    ConfigModule,
    Web3Module,
    MinioModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          endPoint: configService.get('S3_HOST', '127.0.0.1'),
          port: Number(configService.get<number>('S3_PORT', 9000)),
          useSSL: false,
          accessKey: configService.get('S3_ACCESS_KEY', 'access-key'),
          secretKey: configService.get('S3_SECRET_KEY', 'secrete-key'),
        };
      },
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, RateService],
  exports: [PaymentService, PaymentRepository, RateService],
})
export class PaymentModule {}
