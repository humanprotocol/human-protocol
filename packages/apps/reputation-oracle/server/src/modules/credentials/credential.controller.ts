import {
  Controller,
  Get,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { CredentialService } from './credential.service';
import { CreateCredentialDto, CredentialQueryDto } from './credential.dto';
import { CredentialExceptionFilter } from '../../common/exceptions/credential.filter';
import { Public } from '../../common/decorators';
import { UserType } from '../../common/enums/user';

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
  @ApiResponse({
    status: 200,
    description: 'Credentials retrieved successfully',
    isArray: true,
  })
  public async getCredentials(
    @Req() req: any,
    @Query() query: CredentialQueryDto,
  ): Promise<any> {
    const { status, reference } = query;
    try {
      const credentials = await this.credentialService.getCredentials(
        req.user,
        status,
        reference,
      );
      return credentials;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch credentials',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
