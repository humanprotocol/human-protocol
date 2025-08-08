import { Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { KycProcedureService } from './kyc-procedure.service';
import { KycProcedureStartResponse } from './model/kyc-start.model';

@ApiTags('Kyc-Procedure')
@ApiBearerAuth()
@Controller('/kyc')
export class KycProcedureController {
  constructor(private readonly service: KycProcedureService) {}

  @ApiOperation({
    summary: 'Endpoint to start Kyc process for the user',
  })
  @HttpCode(200)
  @Post('/start')
  async startKycProcedure(
    @Request() req: RequestWithUser,
  ): Promise<KycProcedureStartResponse> {
    return this.service.processStartKycProcedure(req.token);
  }

  @ApiOperation({
    summary: 'Endpoint to get a signed address for the KYC process.',
  })
  @Get('/on-chain')
  async onChainKyc(@Request() req: RequestWithUser): Promise<void> {
    return this.service.processKycOnChain(req.token);
  }
}
