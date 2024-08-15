import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RegisterWorkerCommand,
  RegisterWorkerDto,
  RegisterWorkerResponse,
  SignupWorkerCommand,
  SignupWorkerDto,
} from './model/worker-registration.model';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { WorkerService } from './worker.service';
import {
  SigninWorkerCommand,
  SigninWorkerDto,
  SigninWorkerResponse,
} from './model/worker-signin.model';
import { Authorization } from '../../common/config/params-decorators';

@Controller()
export class WorkerController {
  constructor(
    private readonly service: WorkerService,
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
    return this.service.signupWorker(signupWorkerCommand);
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
    return this.service.signinWorker(signinWorkerCommand);
  }

  @ApiTags('User-Worker')
  @ApiBearerAuth()
  @Post('/register')
  @ApiOperation({ summary: 'Worker registration completed' })
  @UsePipes(new ValidationPipe())
  public registerWorker(
    @Body() registerWorkerDto: RegisterWorkerDto,
    @Authorization() token: string,
  ): Promise<RegisterWorkerResponse> {
    const registerWorkerCommand = this.mapper.map(
      registerWorkerDto,
      RegisterWorkerDto,
      RegisterWorkerCommand,
    );
    registerWorkerCommand.token = token;

    return this.service.registerWorker(registerWorkerCommand);
  }
}
