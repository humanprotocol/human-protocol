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
import {
  CreateCredentialDto,
  CredentialQueryDto,
  CredentialDto,
} from './credential.dto';
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
  @Post()
  @ApiOperation({ summary: 'Create a new credential' })
  @ApiResponse({
    status: 201,
    description: 'Credential created successfully',
    type: CredentialDto,
  })
  public async createCredential(
    @Req() req: any,
    @Body() createCredentialDto: CreateCredentialDto,
  ): Promise<{ credential_id: number }> {
    if (req.user.role !== UserType.CREDENTIAL_VALIDATOR) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    try {
      const credential =
        await this.credentialService.createCredential(createCredentialDto);
      return { credential_id: credential.id };
    } catch (error) {
      if (error.code === '23505') {
        throw new HttpException('Duplicate reference', HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Failed to create credential',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('on-chain')
  @ApiOperation({ summary: 'Add a credential on-chain' })
  @ApiResponse({
    status: 201,
    description: 'Credential added on-chain successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  public async addCredentialOnChain(
    @Body() addCredentialOnChainDto: AddCredentialOnChainDto,
  ): Promise<void> {
    const { credential_id, workerAddress, signature, chainId, escrowAddress } =
      addCredentialOnChainDto;
    await this.credentialService.addCredentialOnChain(
      credential_id,
      workerAddress,
      signature,
      chainId,
      escrowAddress,
    );
  }
}
