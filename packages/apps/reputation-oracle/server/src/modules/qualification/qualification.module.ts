import { Module } from '@nestjs/common';

import { UserRepository } from '../user/user.repository';

import { QualificationService } from './qualification.service';
import { QualificationRepository } from './qualification.repository';
import { QualificationController } from './qualification.controller';

@Module({
  imports: [],
  providers: [QualificationService, QualificationRepository, UserRepository],
  controllers: [QualificationController],
  exports: [QualificationService],
})
export class QualificationModule {}
