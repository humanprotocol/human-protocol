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
  RegistrationInExchangeOracleResponse,
  RegistrationInExchangeOracleCommand,
  RegistrationInExchangeOracleDto,
  RegistrationInExchangeOraclesResponse,
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
  @Post('/exchange-oracle-registration')
  @ApiOperation({ summary: 'Registers a worker in Exchange Oracle' })
  @UsePipes(new ValidationPipe())
  public createRegistrationInExchangeOracle(
    @Body() registrationInExchangeOracleDto: RegistrationInExchangeOracleDto,
    @Authorization() token: string,
  ): Promise<RegistrationInExchangeOracleResponse> {
    const registrationInExchangeOracle = this.mapper.map(
      registrationInExchangeOracleDto,
      RegistrationInExchangeOracleDto,
      RegistrationInExchangeOracleCommand,
    );
    registrationInExchangeOracle.token = token;

    return this.service.registrationInExchangeOracle(
      registrationInExchangeOracle,
    );
  }

  @ApiBearerAuth()
  @Get('/exchange-oracle-registration')
  @ApiOperation({ summary: 'Retrieves oracles registered by the worker' })
  @UsePipes(new ValidationPipe())
  public getRegistrationInExchangeOracles(
    @Authorization() token: string,
  ): Promise<RegistrationInExchangeOraclesResponse> {
    return this.service.getRegistrationInExchangeOracles(token);
  }
}
