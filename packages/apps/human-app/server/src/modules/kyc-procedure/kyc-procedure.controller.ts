import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { KycProcedureService } from './kyc-procedure.service';
import { KycProcedureStartResponse } from './model/kyc-start.model';

@ApiTags('Kyc-Procedure')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/kyc')
export class KycProcedureController {
  constructor(private readonly service: KycProcedureService) {}

  @Post('/start')
  @ApiOperation({
    summary: 'Endpoint to start Kyc process for the user',
  })
  public async startKycProcedure(
    @Request() req: RequestWithUser,
  ): Promise<KycProcedureStartResponse> {
    return this.service.processStartKycProcedure(req.token);
  }

  @Get('/on-chain')
  @ApiOperation({
    summary: 'Endpoint to get a signed address for the KYC process.',
  })
  public async onChainKyc(@Request() req: RequestWithUser): Promise<void> {
    return this.service.processKycOnChain(req.token);
  }
}
