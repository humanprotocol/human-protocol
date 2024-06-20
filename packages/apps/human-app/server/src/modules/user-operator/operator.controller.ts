import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OperatorService } from './operator.service';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SigninOperatorCommand,
  SigninOperatorDto,
  SigninOperatorResponse,
  SignupOperatorCommand,
  SignupOperatorDto,
} from './model/operator.model';

@Controller()
export class OperatorController {
  constructor(
    private readonly service: OperatorService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('User-Operator')
  @Post('/auth/web3/signup')
  @ApiOperation({ summary: 'Operator signup' })
  @UsePipes(new ValidationPipe())
  public signupOperator(
    @Body() signupOperatorDto: SignupOperatorDto,
  ): Promise<void> {
    const signupOperatorCommand = this.mapper.map(
      signupOperatorDto,
      SignupOperatorDto,
      SignupOperatorCommand,
    );
    return this.service.signupOperator(signupOperatorCommand);
  }

  @ApiTags('User-Operator')
  @Post('/auth/web3/signin')
  @ApiOperation({ summary: 'Operator signin' })
  @UsePipes(new ValidationPipe())
  public signinOperator(
    @Body() dto: SigninOperatorDto,
  ): Promise<SigninOperatorResponse> {
    const command = this.mapper.map(
      dto,
      SigninOperatorDto,
      SigninOperatorCommand,
    );
    return this.service.signinOperator(command);
  }
}
