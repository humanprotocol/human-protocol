import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { QualificationService } from './qualification.service';
import { QualificationEntity } from './qualification.entity';
import { QualificationRepository } from './qualification.repository';
import { UserRepository } from '../user/user.repository';
import { QualificationController } from './qualification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QualificationEntity]), ConfigModule],
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
