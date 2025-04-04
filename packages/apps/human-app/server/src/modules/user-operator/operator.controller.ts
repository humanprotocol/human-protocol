import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '../../common/config/params-decorators';

import { OperatorService } from './operator.service';
import {
  SignupOperatorCommand,
  SignupOperatorDto,
} from './model/operator-registration.model';
import {
  SigninOperatorCommand,
  SigninOperatorDto,
  SigninOperatorResponse,
} from './model/operator-signin.model';
import {
  DisableOperatorCommand,
  DisableOperatorDto,
} from './model/disable-operator.model';
import {
  EnableOperatorCommand,
  EnableOperatorDto,
} from './model/enable-operator.model';

@Controller()
export class OperatorController {
  constructor(
    private readonly service: OperatorService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('User-Operator')
  @Post('/auth/web3/signup')
  @HttpCode(200)
  @ApiOperation({ summary: 'Operator signup' })
  @UsePipes(new ValidationPipe())
  async signupOperator(
    @Body() signupOperatorDto: SignupOperatorDto,
  ): Promise<void> {
    const signupOperatorCommand = this.mapper.map(
      signupOperatorDto,
      SignupOperatorDto,
      SignupOperatorCommand,
    );
    await this.service.signupOperator(signupOperatorCommand);
  }

  @ApiTags('User-Operator')
  @Post('/auth/web3/signin')
  @HttpCode(200)
  @ApiOperation({ summary: 'Operator signin' })
  @UsePipes(new ValidationPipe())
  async signinOperator(
    @Body() dto: SigninOperatorDto,
  ): Promise<SigninOperatorResponse> {
    const command = this.mapper.map(
      dto,
      SigninOperatorDto,
      SigninOperatorCommand,
    );
    return this.service.signinOperator(command);
  }

  @ApiTags('User-Operator')
  @Post('/disable-operator')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Endpoint to disable an operator',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  async disableOperator(
    @Body() disableOperatorDto: DisableOperatorDto,
    @Authorization() token: string,
  ): Promise<void> {
    const disableOperatorCommand = this.mapper.map(
      disableOperatorDto,
      DisableOperatorDto,
      DisableOperatorCommand,
    );
    disableOperatorCommand.token = token;
    await this.service.disableOperator(disableOperatorCommand);
  }

  @ApiTags('User-Operator')
  @Post('/enable-operator')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Endpoint to enable an operator',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  async enable(
    @Body() enableOperatorDto: EnableOperatorDto,
    @Authorization() token: string,
  ): Promise<void> {
    const enableOperatorCommand = this.mapper.map(
      enableOperatorDto,
      EnableOperatorDto,
      EnableOperatorCommand,
    );
    enableOperatorCommand.token = token;
    await this.service.enableOperator(enableOperatorCommand);
  }
}
