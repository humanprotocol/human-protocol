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
  SignupOperatorCommand,
  SignupOperatorDto,
} from './model/operator-registration.model';

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
}
