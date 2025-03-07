import { Module } from '@nestjs/common';

import { UserModule } from '../user';

import { QualificationService } from './qualification.service';
import { QualificationRepository } from './qualification.repository';
import { QualificationController } from './qualification.controller';

@Module({
  imports: [UserModule],
  providers: [QualificationService, QualificationRepository],
  controllers: [QualificationController],
})
export class QualificationModule {}
