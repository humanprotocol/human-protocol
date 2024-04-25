import { Controller, Post } from '@nestjs/common';
import { KycProcedureService } from './kyc-procedure.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KycProcedureStartResponse } from './model/kyc-start.model';

@Controller('/kyc')
export class KycProcedureController {
  constructor(private readonly service: KycProcedureService) {}

  @ApiTags('Kyc-Procedure')
  @Post('/start')
  @ApiOperation({
    summary: 'Endpoint to start Kyc process for the user',
  })
  public async startKycProcedure(): Promise<KycProcedureStartResponse> {
    return this.service.processStartKycProcedure();
  }
}
