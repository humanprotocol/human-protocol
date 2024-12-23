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

@ApiTags('Kyc')
@Controller('/kyc')
@UseFilters(KycErrorFilter)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/start')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Start Kyc',
    description: 'Endpoint to start Kyc process for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kyc session started successfully',
    type: KycSessionDto,
  })
  async startKyc(@Req() request: RequestWithUser): Promise<KycSessionDto> {
    return this.kycService.initSession(request.user);
  }

  @Post('/update')
  @UseGuards(KycWebhookAuthGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Update Kyc status',
    description: 'Endpoint to update Kyc process for the user.',
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
  public updateKycStatus(@Body() data: KycStatusDto): Promise<void> {
    return this.kycService.updateKycStatus(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/on-chain')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get Signed Address',
    description: 'Endpoint to get a signed address for the KYC process.',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC signed address generated successfully',
    type: KycSignedAddressDto,
  })
  async getSignedAddress(
    @Req() request: RequestWithUser,
  ): Promise<KycSignedAddressDto> {
    return this.kycService.getSignedAddress(request.user);
  }
}
