import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JobSolutionsRequestDto } from './job.dto';
import { JobService } from './job.service';
import { SignatureAuthGuard } from '../../common/guards';
import { Role } from '../../common/enums/role';

@Controller('/job')
@ApiTags('Job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @UseGuards(new SignatureAuthGuard([Role.Exchange]))
  @Post('/solve')
  public async solve(@Body() fortune: JobSolutionsRequestDto): Promise<string> {
    return await this.jobService.processJobSolution(fortune);
  }
}
