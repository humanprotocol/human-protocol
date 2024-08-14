import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QualificationService } from './qualification.service';
import { QualificationController } from './qualification.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [Logger, QualificationService],
  controllers: [QualificationController],
  exports: [QualificationService],
})
export class QualificationModule {}
