import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorization } from '../../common/config/params-decorators';
import {
  OraclesRegistrationResponse,
  WorkerRegistrationCommand,
  WorkerRegistrationDto,
  WorkerRegistrationResponse,
  SignupWorkerCommand,
  SignupWorkerDto,
} from './model/worker-registration.model';
import {
  SigninWorkerCommand,
  SigninWorkerDto,
  SigninWorkerResponse,
} from './model/worker-signin.model';
import { WorkerService } from './worker.service';

@ApiTags('User-Worker')
@Controller()
export class WorkerController {
  constructor(
    private readonly service: WorkerService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
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

  @ApiBearerAuth()
  @Post('/registration')
  @ApiOperation({ summary: 'Register a worker in Exchange Oracle' })
  @UsePipes(new ValidationPipe())
  public workerRegistration(
    @Body() workerRegistrationDto: WorkerRegistrationDto,
    @Authorization() token: string,
  ): Promise<WorkerRegistrationResponse> {
    const workerRegistrationCommand = this.mapper.map(
      workerRegistrationDto,
      WorkerRegistrationDto,
      WorkerRegistrationCommand,
    );
    workerRegistrationCommand.token = token;

    return this.service.workerRegistration(workerRegistrationCommand);
  }

  @ApiBearerAuth()
  @Get('/registration')
  @ApiOperation({ summary: 'Retrieve oracles registered by the worker' })
  @UsePipes(new ValidationPipe())
  public getRegisteredOracles(
    @Authorization() token: string,
  ): Promise<OraclesRegistrationResponse> {
    return this.service.getRegisteredOracles(token);
  }
}
