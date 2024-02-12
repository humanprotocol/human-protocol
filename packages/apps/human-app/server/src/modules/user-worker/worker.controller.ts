import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SignupWorkerCommand,
  SignupWorkerDto,
} from './interfaces/worker-registration.interface';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { WorkerService } from './worker.service';
import {
  SigninWorkerCommand,
  SigninWorkerDto,
} from './interfaces/worker-signin.interface';
import { SigninWorkerResponse } from './interfaces/worker-signin.interface';

@Controller()
export class WorkerController {
  constructor(
    private readonly authWorkerService: WorkerService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
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

  @ApiTags('User-Worker')
  @Post('/auth/signin')
  @ApiOperation({ summary: 'Worker signin' })
  @UsePipes(new ValidationPipe())
  public signinWorker(
    @Body() signinWorkerDto: SigninWorkerDto,
  ): Promise<SigninWorkerResponse> {
    const signinWorkerCommand = this.mapper.map(
      signinWorkerDto,
      SigninWorkerDto,
      SigninWorkerCommand,
    );
    return this.authWorkerService.signinWorker(signinWorkerCommand);
  }
}
