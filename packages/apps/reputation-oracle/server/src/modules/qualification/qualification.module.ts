import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QualificationService } from './qualification.service';
import { QualificationRepository } from './qualification.repository';
import { UserRepository } from '../user/user.repository';
import { QualificationController } from './qualification.controller';

@Module({
  imports: [ConfigModule],
  providers: [QualificationService, QualificationRepository, UserRepository],
  controllers: [QualificationController],
  exports: [QualificationService],
})
export class QualificationModule {}
