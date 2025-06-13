import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { RequestWithUser } from '../../common/interfaces/jwt';
import {
  DisableOperatorCommand,
  DisableOperatorDto,
} from './model/disable-operator.model';
import {
  EnableOperatorCommand,
  EnableOperatorDto,
} from './model/enable-operator.model';
import {
  SignupOperatorCommand,
  SignupOperatorDto,
} from './model/operator-registration.model';
import {
  SigninOperatorCommand,
  SigninOperatorDto,
  SigninOperatorResponse,
  SignupOperatorResponse,
} from './model/operator-signin.model';
import { OperatorService } from './operator.service';

@ApiTags('User-Operator')
@Controller()
export class OperatorController {
  constructor(
    private readonly service: OperatorService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Post('/auth/web3/signup')
  @HttpCode(200)
  @ApiOperation({ summary: 'Operator signup' })
  async signupOperator(
    @Body() signupOperatorDto: SignupOperatorDto,
  ): Promise<SignupOperatorResponse> {
    const signupOperatorCommand = this.mapper.map(
      signupOperatorDto,
      SignupOperatorDto,
      SignupOperatorCommand,
    );
    return this.service.signupOperator(signupOperatorCommand);
  }

  @Post('/auth/web3/signin')
  @HttpCode(200)
  @ApiOperation({ summary: 'Operator signin' })
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

  @Post('/disable-operator')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Endpoint to disable an operator',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async disableOperator(
    @Body() disableOperatorDto: DisableOperatorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const disableOperatorCommand = this.mapper.map(
      disableOperatorDto,
      DisableOperatorDto,
      DisableOperatorCommand,
    );
    disableOperatorCommand.token = req.token;
    await this.service.disableOperator(disableOperatorCommand);
  }

  @Post('/enable-operator')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Endpoint to enable an operator',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async enable(
    @Body() enableOperatorDto: EnableOperatorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const enableOperatorCommand = this.mapper.map(
      enableOperatorDto,
      EnableOperatorDto,
      EnableOperatorCommand,
    );
    enableOperatorCommand.token = req.token;
    await this.service.enableOperator(enableOperatorCommand);
  }
}
