import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Worker signup' })
  @Public()
  @HttpCode(200)
  @Post('/auth/signup')
  async signupWorker(@Body() signupWorkerDto: SignupWorkerDto): Promise<void> {
    const signupWorkerCommand = this.mapper.map(
      signupWorkerDto,
      SignupWorkerDto,
      SignupWorkerCommand,
    );
    return this.service.signupWorker(signupWorkerCommand);
  }

  @ApiOperation({ summary: 'Worker signin' })
  @Public()
  @HttpCode(200)
  @Post('/auth/signin')
  async signinWorker(
    @Body() signinWorkerDto: SigninWorkerDto,
  ): Promise<SigninWorkerResponse> {
    const signinWorkerCommand = this.mapper.map(
      signinWorkerDto,
      SigninWorkerDto,
      SigninWorkerCommand,
    );
    return this.service.signinWorker(signinWorkerCommand);
  }

  @ApiOperation({ summary: 'Registers a worker in Exchange Oracle' })
  @ApiBearerAuth()
  @HttpCode(200)
  @Post('/exchange-oracle-registration')
  async createRegistrationInExchangeOracle(
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

  @ApiOperation({ summary: 'Retrieves oracles registered by the worker' })
  @ApiBearerAuth()
  @HttpCode(200)
  @Get('/exchange-oracle-registration')
  async getRegistrationInExchangeOracles(
    @Request() req: RequestWithUser,
  ): Promise<RegistrationInExchangeOraclesResponse> {
    return this.service.getRegistrationInExchangeOracles(req.token);
  }
}
