import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import {
  PrepareSignatureCommand,
  PrepareSignatureDto,
  PrepareSignatureResponse,
} from './model/prepare-signature.model';
import { PrepareSignatureService } from './prepare-signature.service';

@ApiTags('Prepare-Signature')
@Public()
@Controller('/prepare-signature')
export class PrepareSignatureController {
  constructor(
    private readonly service: PrepareSignatureService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({
    summary:
      'Endpoint for generating typed structured data objects compliant with EIP-712. The generated object should be convertible to a string format to ensure compatibility with signature mechanisms',
  })
  @HttpCode(200)
  @Post('/')
  async prepareSignature(
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
