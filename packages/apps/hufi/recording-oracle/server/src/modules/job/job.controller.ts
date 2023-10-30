import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JobSolutionsRequestDto, liquidityRequestDto, liquidityScores } from './job.dto';
import { JobService } from './job.service';
import { SignatureAuthGuard } from '../../common/guards';
import { Role } from '../../common/enums/role';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';

@Controller('/job')
@ApiTags('Job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @UseGuards(new SignatureAuthGuard([Role.Exchange]))
  @Post('liquidity')
  getLiquidityScore(@Body() body: liquidityRequestDto): Promise<any>{
    return this.jobService.getLiquidityScore(
      body
    )
  }

  @Post('saveLiquidity')
  saveLiquidity(@Body() body: liquidityRequestDto): Promise<any>{
    return this.jobService.getLiquidityScore(
      body
    )
  }
}
