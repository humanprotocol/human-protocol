import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobService } from './job.service';
import { campaignDetailsDto, liquidityRequestDto } from './job.dto';

@ApiTags('Job')
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('details/:chainId/:escrowAddress')
  getDetails(
    @Param('chainId') chainId: number,
    @Param('escrowAddress') escrowAddress: string,
  ): Promise<campaignDetailsDto> {
    return this.jobService.getDetails(chainId, escrowAddress);
  }

  @Get('campaigns/:chainId')
  getPendingJobs(@Param('chainId') chainId: number): Promise<any> {
    return this.jobService.getCampaignsList(chainId);
  }

  @Post('liquidity')
  getLiquidityScore(@Body() body: liquidityRequestDto): Promise<any> {
    return this.jobService.getLiquidityScore(
      body.chainId,
      body.escrowAddress,
      body.liquidityProvider,
      false,
    );
  }

  @Post('saveLiquidity')
  saveScore(@Body() body: liquidityRequestDto): Promise<any> {
    return this.jobService.getLiquidityScore(
      body.chainId,
      body.escrowAddress,
      body.liquidityProvider,
      true,
    );
  }
}
