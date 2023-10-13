import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JobSolutionsRequestDto } from './job.dto';
import { JobService } from './job.service';
import { SignatureAuthGuard } from '../../common/guards';
import { Role } from '../../common/enums/role';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';

@Controller('/job')
@ApiTags('Job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @UseGuards(new SignatureAuthGuard([Role.Exchange]))
  @Post('/solve')
  public async solve(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() fortune: JobSolutionsRequestDto,
  ): Promise<string> {
    return await this.jobService.processJobSolution(fortune);
  }
}
