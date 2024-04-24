import { Module } from '@nestjs/common';
import { KycProcedureController } from './kyc-procedure.controller';
import { KycProcedureService } from './kyc-procedure.service';

@Module({
  controllers: [KycProcedureController],
  providers: [KycProcedureService],
})
export class KycProcedureModule {}
