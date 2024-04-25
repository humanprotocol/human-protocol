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
import {
  PrepareSignatureCommand,
  PrepareSignatureDto,
  PrepareSignatureResponse,
} from './model/prepare-signature.model';
import { Authorization } from '../../common/config/params-decorators';
import {
  DisableOperatorCommand,
  DisableOperatorDto,
} from './model/disable-operator.model';

@Controller()
export class DisableOperatorController {
  constructor(
    private readonly service: DisableOperatorService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Disable-Operator')
  @Post('/disable-operator/prepare-signature')
  @ApiOperation({
    summary:
      'Endpoint for generating typed structured data objects compliant with EIP-712. The generated object should be convertible to a string format to ensure compatibility with signature mechanisms',
  })
  @UsePipes(new ValidationPipe())
  public async prepareSignature(
    @Body() prepareSignatureDto: PrepareSignatureDto,
  ): Promise<PrepareSignatureResponse> {
    const prepareSignatureCommand = this.mapper.map(
      prepareSignatureDto,
      PrepareSignatureDto,
      PrepareSignatureCommand,
    );
    return this.service.processPrepareSignature(prepareSignatureCommand);
  }

  @ApiTags('Disable-Operator')
  @Post('/disable-operator')
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
