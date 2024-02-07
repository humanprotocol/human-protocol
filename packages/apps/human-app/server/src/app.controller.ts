import {
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SignupWorkerCommand,
  SignupWorkerDto,
} from './modules/user-worker/interfaces/worker-registration.interface';
import { WorkerService } from './modules/user-worker/worker.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

@Controller()
export class AppController {
  constructor(
    private readonly authWorkerService: WorkerService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Get('/')
  @Redirect('/swagger', 301)
  @ApiExcludeEndpoint()
  public swagger(): string {
    return 'OK';
  }

  @ApiTags('User-Worker')
  @Post('/auth/signup')
  @ApiOperation({ summary: 'Worker signup' })
  @UsePipes(new ValidationPipe())
  public signupWorker(@Body() signupWorkerDto: SignupWorkerDto): Promise<void> {
    const signupWorkerCommand = this.mapper.map(
      signupWorkerDto,
      SignupWorkerDto,
      SignupWorkerCommand,
    );
    return this.authWorkerService.signupWorker(signupWorkerCommand);
  }
}
