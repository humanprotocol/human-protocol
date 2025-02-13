import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  HttpCode,
  Logger,
  Ip,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { NDAService } from './nda.service';
import { RequestWithUser } from '../../common/types';
import { NDASignatureEntity } from './nda-signature.entity';
import { NdaVersionDto } from './nda.dto';
import { NdaErrorFilter } from './nda.error.filter';

@ApiTags('NDA')
@Controller('/nda')
@ApiBearerAuth()
@UseFilters(NdaErrorFilter)
@UseGuards(JwtAuthGuard)
export class NDAController {
  constructor(
    private readonly ndaService: NDAService,
    private readonly logger: Logger,
  ) {}

  @Get('/')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Retrieve the last NDA version',
    description:
      'Endpoint to retrieve the last NDA version. If the user already signed it, return null.',
  })
  @ApiResponse({
    status: 200,
    description: 'Last NDA version retrieved successfully',
    type: NdaVersionDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async getLastNDAVersion(): Promise<NdaVersionDto | null> {
    return this.ndaService.getLastNDAVersion();
  }

  @Post('/sign')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Sign NDA',
    description: 'Endpoint to sign the NDA.',
  })
  @ApiResponse({
    status: 200,
    description: 'NDA signed successfully',
    type: NDASignatureEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. NDA version not found.',
  })
  public async signNDA(
    @Req() request: RequestWithUser,
    @Ip() ipAddress: string,
  ): Promise<boolean | null> {
    return this.ndaService.signNDA(request.user, ipAddress);
  }
}
