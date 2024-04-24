import { Controller, Post } from '@nestjs/common';
import { KycProcedureService } from './kyc-procedure.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KycProcedureStartResponse } from './model/kyc-start.model';

@Controller()
export class KycProcedureController {
  constructor(private readonly kycProcedureService: KycProcedureService) {}

  @ApiTags('Kyc-Procedure')
  @Post('/kyc/start')
  @ApiOperation({
    summary: 'Endpoint to start Kyc process for the user',
  })
  public async startKycProcedure(): Promise<KycProcedureStartResponse> {
    return this.kycProcedureService.processStartKycProcedure();
  }
}
