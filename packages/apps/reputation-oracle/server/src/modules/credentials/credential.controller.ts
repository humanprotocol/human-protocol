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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CredentialService } from './credential.service';
import { CredentialEntity } from './credential.entity';
import { CredentialStatus } from '../../common/enums/credential';
import { CredentialExceptionFilter } from '../../common/exceptions/credential.filter';

@ApiTags('Credentials')
@UseFilters(CredentialExceptionFilter)
@Controller('/credential')
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
    description: 'Returns a list of credentials',
    type: [CredentialEntity],
  })
  @ApiResponse({ status: 403, description: 'Forbidden. Unauthorized access.' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error. Failed to fetch credentials.',
  })
  public async getCredentials(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('reference') reference?: string,
  ): Promise<CredentialEntity[]> {
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
