import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { KYCSessionDto, KYCStatusDto } from './kyc.dto';
import { KYCService } from './kyc.service';

@ApiTags('KYC')
@Controller('/kyc')
export class KYCController {
  constructor(private readonly kycService: KYCService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('/start')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Start KYC',
    description: 'Endpoint to start KYC process for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC session started successfully',
    type: KYCSessionDto,
  })
  async startKYC(@Req() request: RequestWithUser): Promise<KYCSessionDto> {
    return this.kycService.initSession(request.user);
  }

  @Post('/update')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Update KYC status',
    description: 'Endpoint to update KYC process for the user.',
  })
  @ApiBody({ type: KYCStatusDto })
  @ApiResponse({
    status: 200,
    description: 'KYC status updated successfully',
  })
  public updateKYCStatus(@Body() data: KYCStatusDto): Promise<void> {
    return this.kycService.updateKYCStatus(data);
  }
}
