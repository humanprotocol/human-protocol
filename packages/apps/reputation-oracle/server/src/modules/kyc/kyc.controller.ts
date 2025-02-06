import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { KycSessionDto, KycSignedAddressDto, KycStatusDto } from './kyc.dto';
import { KycService } from './kyc.service';
import { KycWebhookAuthGuard } from '../../common/guards/kyc-webhook.auth';
import { KycErrorFilter } from './kyc.error.filter';

@ApiTags('KYC')
@Controller('/kyc')
@UseFilters(KycErrorFilter)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiOperation({
    summary: 'Start KYC',
    description: 'Endpoint to start KYC process for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC session started successfully',
    type: KycSessionDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/start')
  @HttpCode(200)
  async startKyc(@Req() request: RequestWithUser): Promise<KycSessionDto> {
    const kycSessionData = await this.kycService.initSession(request.user);
    return kycSessionData;
  }

  @ApiOperation({
    summary: 'Update KYC status',
    description: 'Endpoint to update KYC process for the user',
  })
  @ApiHeader({
    name: 'x-auth-client',
    description: 'API key for the webhook authentication',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiHeader({
    name: 'x-hmac-signature',
    description: 'HMAC signature for verifying the request',
    required: true,
    schema: {
      type: 'string',
    },
  })
  @ApiBody({ type: KycStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Kyc status updated successfully',
  })
  @Post('/update')
  @UseGuards(KycWebhookAuthGuard)
  @HttpCode(200)
  async updateKycStatus(@Body() data: KycStatusDto): Promise<void> {
    await this.kycService.updateKycStatus(data);
  }

  @ApiOperation({
    summary: 'Get Signed Address',
    description: 'Endpoint to get a signed address for the KYC process.',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC signed address generated successfully',
    type: KycSignedAddressDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/on-chain')
  @HttpCode(200)
  async getSignedAddress(
    @Req() request: RequestWithUser,
  ): Promise<KycSignedAddressDto> {
    const signedAddressData = await this.kycService.getSignedAddress(
      request.user,
    );
    return signedAddressData;
  }
}
