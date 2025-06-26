import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { RequestWithUser } from '../../common/interfaces/jwt';
import {
  RegistrationInExchangeOracleCommand,
  RegistrationInExchangeOracleDto,
  RegistrationInExchangeOracleResponse,
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
  @Public()
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
  @Public()
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
  public createRegistrationInExchangeOracle(
    @Body() registrationInExchangeOracleDto: RegistrationInExchangeOracleDto,

    @Request() req: RequestWithUser,
  ): Promise<RegistrationInExchangeOracleResponse> {
    const registrationInExchangeOracle = this.mapper.map(
      registrationInExchangeOracleDto,
      RegistrationInExchangeOracleDto,
      RegistrationInExchangeOracleCommand,
    );
    registrationInExchangeOracle.token = req.token;

    return this.service.registrationInExchangeOracle(
      registrationInExchangeOracle,
    );
  }

  @ApiBearerAuth()
  @Get('/exchange-oracle-registration')
  @ApiOperation({ summary: 'Retrieves oracles registered by the worker' })
  public getRegistrationInExchangeOracles(
    @Request() req: RequestWithUser,
  ): Promise<RegistrationInExchangeOraclesResponse> {
    return this.service.getRegistrationInExchangeOracles(req.token);
  }
}
