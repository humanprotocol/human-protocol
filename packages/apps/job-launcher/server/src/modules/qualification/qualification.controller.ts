import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { QualificationService } from './qualification.service';
import { QualificationDto } from './qualification.dto';
import { JwtAuthGuard } from '../../common/guards';

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
  @ApiResponse({ status: 200, description: 'List of qualifications' })
  getQualifications(): Promise<QualificationDto[]> {
    return this.qualificationService.getQualifications();
  }
}
