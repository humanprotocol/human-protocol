import { Controller, Post } from '@nestjs/common';
import { KycProcedureService } from './kyc-procedure.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KycProcedureStartResponse } from './model/kyc-start.model';
import { Authorization } from '../../common/config/params-decorators';

@Controller('/kyc')
export class KycProcedureController {
  constructor(private readonly service: KycProcedureService) {}

  @ApiTags('Kyc-Procedure')
  @Post('/start')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Endpoint to start Kyc process for the user',
  })
  public async startKycProcedure(
    @Authorization() token: string,
  ): Promise<KycProcedureStartResponse> {
    return this.service.processStartKycProcedure(token);
  }
}
