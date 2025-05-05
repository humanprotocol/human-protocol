import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RequestWithUser } from '../../common/types';
import { NDAConfigService } from '../../config';

import { NDASignatureDto } from './nda.dto';
import { NDAErrorFilter } from './nda.error-filter';
import { NDAService } from './nda.service';

@ApiTags('NDA')
@ApiBearerAuth()
@UseFilters(NDAErrorFilter)
@Controller('nda')
export class NDAController {
  constructor(
    private readonly ndaService: NDAService,
    private readonly ndaConfigService: NDAConfigService,
  ) {}

  @ApiOperation({
    summary: 'Retrieves latest NDA URL',
    description:
      'Retrieves the latest NDA URL that users must sign to join the oracle',
  })
  @ApiResponse({
    status: 200,
    description: 'URL retrieved successfully',
    type: String,
  })
  @Get('latest')
  getLatestNDA() {
    return this.ndaConfigService.latestNdaUrl;
  }

  @ApiOperation({
    summary: 'Sign NDA',
    description:
      'Signs the NDA with the provided URL. The URL must match the latest NDA URL.',
  })
  @ApiBody({ type: NDASignatureDto })
  @ApiResponse({
    status: 200,
    description: 'NDA signed successfully',
    type: String,
  })
  @HttpCode(200)
  @ApiResponse({
    status: 400,
    description: 'Bad Request. User has already signed the NDA.',
  })
  @Post('sign')
  async signNDA(@Req() request: RequestWithUser, @Body() nda: NDASignatureDto) {
    await this.ndaService.signNDA(request.user, nda);
    return { message: 'NDA signed successfully' };
  }
}
