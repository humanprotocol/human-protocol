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
import { WhitelistModule } from '../whitelist/whitelist.module';
import { JobEntity } from '../job/job.entity';
import { UserEntity } from '../user/user.entity';
import { JobRepository } from '../job/job.repository';
import { UserRepository } from '../user/user.repository';
import { RateModule } from '../rate/rate.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([PaymentEntity, JobEntity, UserEntity]),
    ConfigModule,
    Web3Module,
    WhitelistModule,
    RateModule,
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
  providers: [PaymentService, PaymentRepository, JobRepository, UserRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
