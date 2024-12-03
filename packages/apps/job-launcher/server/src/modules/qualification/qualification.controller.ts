import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { QualificationService } from './qualification.service';
import { QualificationDto } from './qualification.dto';
import { JwtAuthGuard } from '../../common/guards';
import { ChainId } from '@human-protocol/sdk';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Qualification')
@Controller('qualification')
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get list of qualifications from Reputation Oracle',
  })
  @ApiResponse({
    status: 200,
    description: 'List of qualifications',
    type: [QualificationDto],
  })
  @ApiQuery({
    name: 'chainId',
    required: true,
    type: String,
    description: 'The chain ID to get qualifications',
  })
  getQualifications(
    @Query('chainId') chainId: ChainId,
  ): Promise<QualificationDto[]> {
    return this.qualificationService.getQualifications(chainId);
  }
}
