import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Web3Module } from '../web3/web3.module'; // Assuming integration with blockchain
import { UserModule } from '../user/user.module';
import { QualificationService } from './qualification.service';
import { QualificationEntity } from './qualification.entity';
import { QualificationRepository } from './qualification.repository';
import { UserRepository } from '../user/user.repository';
import { QualificationController } from './qualification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([QualificationEntity]),
    ConfigModule,
    Web3Module,
    UserModule,
  ],
  providers: [
    Logger,
    QualificationService,
    QualificationRepository,
    UserRepository,
  ],
  controllers: [QualificationController],
  exports: [QualificationService],
})
export class QualificationModule {}
