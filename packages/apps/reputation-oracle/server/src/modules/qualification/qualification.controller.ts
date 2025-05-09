import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public, Roles } from '../../common/decorators';
import { RolesAuthGuard } from '../../common/guards';
import { UserRole } from '../user';
import {
  AssignQualificationDto,
  CreateQualificationDto,
  QualificationResponseDto,
  UnassignQualificationDto,
  UserQualificationOperationResponseDto,
} from './qualification.dto';
import { QualificationErrorFilter } from './qualification.error-filter';
import { QualificationService } from './qualification.service';

@ApiTags('Qualification')
@Controller('qualifications')
@UseFilters(QualificationErrorFilter)
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @ApiOperation({ summary: 'Create a new qualification' })
  @ApiBody({ type: CreateQualificationDto })
  @ApiResponse({
    status: 201,
    description: 'Qualification created successfully',
    type: QualificationResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(RolesAuthGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  @HttpCode(201)
  async create(
    @Body() createQualificationDto: CreateQualificationDto,
  ): Promise<QualificationResponseDto> {
    const qualification = await this.qualificationService.createQualification({
      title: createQualificationDto.title,
      description: createQualificationDto.description,
      expiresAt: createQualificationDto.expiresAt,
    });
    return qualification;
  }

  @ApiOperation({ summary: 'Get list of qualifications' })
  @ApiResponse({
    status: 200,
    description: 'List of qualifications',
    type: QualificationResponseDto,
    isArray: true,
  })
  @Public()
  @Get()
  @HttpCode(200)
  async getQualifications(): Promise<QualificationResponseDto[]> {
    const qualifications = await this.qualificationService.getQualifications();
    return qualifications;
  }

  @ApiOperation({ summary: 'Delete a qualification' })
  @ApiResponse({
    status: 204,
    description: 'Qualification deleted successfully',
  })
  @ApiResponse({
    status: 422,
    description: 'Cannot delete qualification',
  })
  @ApiBearerAuth()
  @UseGuards(RolesAuthGuard)
  @Roles([UserRole.ADMIN])
  @Delete('/:reference')
  @HttpCode(204)
  async deleteQualification(
    @Param('reference') reference: string,
  ): Promise<void> {
    await this.qualificationService.deleteQualification(reference);
  }

  @ApiOperation({ summary: 'Assign a qualification to users' })
  @ApiBody({ type: AssignQualificationDto })
  @ApiResponse({
    status: 200,
    description: 'Qualification assigned successfully',
  })
  @ApiResponse({ status: 422, description: 'No users found for operation' })
  @ApiBearerAuth()
  @UseGuards(RolesAuthGuard)
  @Roles([UserRole.ADMIN])
  @Post('/:reference/assign')
  @HttpCode(200)
  async assign(
    @Param('reference') reference: string,
    @Body() assignQualificationDto: AssignQualificationDto,
  ): Promise<UserQualificationOperationResponseDto> {
    return await this.qualificationService.assign(
      reference,
      assignQualificationDto.workerAddresses,
    );
  }

  @ApiOperation({ summary: 'Unassign a qualification from users' })
  @ApiBody({ type: UnassignQualificationDto })
  @ApiResponse({
    status: 200,
    description: 'Qualification unassigned successfully',
  })
  @ApiResponse({ status: 422, description: 'No users found for operation' })
  @ApiBearerAuth()
  @UseGuards(RolesAuthGuard)
  @Roles([UserRole.ADMIN])
  @Post('/:reference/unassign')
  @HttpCode(200)
  async unassign(
    @Param('reference') reference: string,
    @Body() unassignQualificationDto: UnassignQualificationDto,
  ): Promise<UserQualificationOperationResponseDto> {
    return await this.qualificationService.unassign(
      reference,
      unassignQualificationDto.workerAddresses,
    );
  }
}
