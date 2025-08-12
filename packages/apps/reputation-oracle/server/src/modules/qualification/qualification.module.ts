import { Module } from '@nestjs/common';

import { UserModule } from '@/modules/user';

import { QualificationController } from './qualification.controller';
import { QualificationRepository } from './qualification.repository';
import { QualificationService } from './qualification.service';
import { UserQualificationRepository } from './user-qualification.repository';

@Module({
  imports: [UserModule],
  providers: [
    QualificationService,
    QualificationRepository,
    UserQualificationRepository,
  ],
  controllers: [QualificationController],
})
export class QualificationModule {}
