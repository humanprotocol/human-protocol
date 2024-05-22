import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PrepareSignatureCommand,
  PrepareSignatureDto,
  PrepareSignatureResponse,
} from './model/prepare-signature.model';
import { PrepareSignatureService } from './prepare-signature.service';
import { Authorization } from '../../common/config/params-decorators';

@Controller('/prepare-signature')
export class PrepareSignatureController {
  constructor(
    private readonly service: PrepareSignatureService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Prepare-Signature')
  @Post('/')
  @ApiOperation({
    summary:
      'Endpoint for generating typed structured data objects compliant with EIP-712. The generated object should be convertible to a string format to ensure compatibility with signature mechanisms',
  })
  @UsePipes(new ValidationPipe())
  public async prepareSignature(
    @Body() prepareSignatureDto: PrepareSignatureDto,
  ): Promise<PrepareSignatureResponse> {
    const command = this.mapper.map(
      prepareSignatureDto,
      PrepareSignatureDto,
      PrepareSignatureCommand,
    );
    return this.service.processPrepareSignature(command);
  }
}
