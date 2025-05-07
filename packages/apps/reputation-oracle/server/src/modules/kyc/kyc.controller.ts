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
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '../../common/decorators';
import { RequestWithUser } from '../../common/types';
import {
  StartSessionResponseDto,
  KycSignedAddressDto,
  UpdateKycStatusDto,
} from './kyc.dto';
import { KycErrorFilter } from './kyc.error-filter';
import { KycService } from './kyc.service';
import { KycWebhookAuthGuard } from './kyc-webhook-auth.guard';

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
    type: StartSessionResponseDto,
  })
  @ApiBearerAuth()
  @Post('/start')
  @HttpCode(200)
  async startKyc(
    @Req() request: RequestWithUser,
  ): Promise<StartSessionResponseDto> {
    return await this.kycService.initSession(request.user);
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
  @ApiBody({ type: UpdateKycStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Kyc status updated successfully',
  })
  @Public()
  @Post('/update')
  @UseGuards(KycWebhookAuthGuard)
  @HttpCode(200)
  async updateKycStatus(@Body() data: UpdateKycStatusDto): Promise<void> {
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
