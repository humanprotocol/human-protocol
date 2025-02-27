import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { NDAService } from './nda.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { RequestWithUser } from 'src/common/interfaces/request';
import { NDAErrorFilter } from './nda.error.filter';
import { AuthConfigService } from 'src/config/auth-config.service';
import { NDASignatureDto } from './nda.dto';

@ApiTags('NDA')
@UseFilters(NDAErrorFilter)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nda')
export class NDAController {
  constructor(
    private readonly ndaService: NDAService,
    private readonly authConfigService: AuthConfigService,
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Get('latest')
  getLatestNDA() {
    return this.authConfigService.latestNdaUrl;
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
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
