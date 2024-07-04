import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import {
  KycSessionDto,
  KycSignedAddressDto,
  KycStatusDto,
  KycUpdateWebhookQueryDto,
} from './kyc.dto';
import { KycService } from './kyc.service';

@ApiTags('Kyc')
@Controller('/kyc')
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
  @HttpCode(200)
  @ApiOperation({
    summary: 'Update Kyc status',
    description: 'Endpoint to update Kyc process for the user.',
  })
  @ApiQuery({
    name: 'secret',
    description: 'Secret for the webhook authentication.',
    type: String,
    required: true,
  })
  @ApiBody({ type: KycStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Kyc status updated successfully',
  })
  public updateKycStatus(
    @Query() query: KycUpdateWebhookQueryDto,
    @Body() data: KycStatusDto,
  ): Promise<void> {
    return this.kycService.updateKycStatus(query.secret, data);
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
