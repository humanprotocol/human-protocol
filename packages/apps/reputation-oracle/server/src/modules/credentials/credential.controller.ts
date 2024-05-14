import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { CredentialService } from './credential.service';
import { CredentialDto, CredentialQueryDto } from './credential.dto';
import { CredentialExceptionFilter } from '../../common/exceptions/credential.filter';
import { Public } from '../../common/decorators';
import { CredentialStatus } from '../../common/enums/credential';

@Public()
@ApiTags('Credentials')
@UseFilters(CredentialExceptionFilter)
@Controller('credential')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Retrieve a list of credentials based on filters' })
  @ApiQuery({ name: 'status', enum: CredentialStatus, required: false })
  @ApiQuery({ name: 'reference', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Credentials retrieved successfully',
    type: [CredentialDto],
    isArray: true,
  })
  public async getCredentials(
    @Req() req: any,
    @Query() query: CredentialQueryDto,
  ): Promise<CredentialDto[]> {
    const { status, reference } = query;
    const userRole = req.user.role;
    try {
      return await this.credentialService.getCredentials(
        req.user,
        status,
        reference,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to fetch credentials',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
