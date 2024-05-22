import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DisableOperatorService } from './disable-operator.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorization } from '../../common/config/params-decorators';
import {
  DisableOperatorCommand,
  DisableOperatorDto,
} from './model/disable-operator.model';

@Controller('/disable-operator')
export class DisableOperatorController {
  constructor(
    private readonly service: DisableOperatorService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Disable-Operator')
  @Post('/')
  @ApiOperation({
    summary: 'Endpoint to disable an operator',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  public async disableOperator(
    @Body() disableOperatorDto: DisableOperatorDto,
    @Authorization() token: string,
  ): Promise<void> {
    const disableOperatorCommand = this.mapper.map(
      disableOperatorDto,
      DisableOperatorDto,
      DisableOperatorCommand,
    );
    disableOperatorCommand.token = token;
    return this.service.processDisableOperator(disableOperatorCommand);
  }
}
