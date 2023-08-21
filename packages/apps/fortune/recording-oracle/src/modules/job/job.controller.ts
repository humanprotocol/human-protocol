import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators';
import { JobSolutionRequestDto } from './job.dto';
import { JobService } from './job.service';

@Controller('/job')
@ApiTags('Job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Public()
  @Post('/solve')
  public async solve(@Body() fortune: JobSolutionRequestDto): Promise<string> {
    return await this.jobService.processJobSolution(fortune);
  }
}
