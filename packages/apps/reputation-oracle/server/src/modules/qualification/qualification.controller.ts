import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

import {
  CreateQualificationDto,
  AssignQualificationDto,
  UnassignQualificationDto,
  QualificationDto,
} from './qualification.dto';
import { QualificationErrorFilter } from './qualification.error.filter';
import { JwtAuthGuard, RolesAuthGuard } from '../../common/guards';
import { QualificationService } from './qualification.service';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums/user';

@ApiTags('Qualification')
@Controller('qualifications')
@ApiBearerAuth()
@UseFilters(QualificationErrorFilter)
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @ApiOperation({ summary: 'Create a new qualification' })
  @ApiBody({ type: CreateQualificationDto })
  @ApiResponse({
    status: 201,
    description: 'Qualification created successfully',
    type: QualificationDto,
  })
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(201)
  /**
   * TODO: revisit DTO validation when
   * refactoring business logic
   */
  async create(
    @Body() createQualificationDto: CreateQualificationDto,
  ): Promise<QualificationDto> {
    const qualification = await this.qualificationService.createQualification(
      createQualificationDto,
    );
    return qualification;
  }

  @ApiOperation({ summary: 'Get list of qualifications' })
  @ApiResponse({
    status: 200,
    description: 'List of qualifications',
    type: QualificationDto,
    isArray: true,
  })
  @Get()
  @HttpCode(200)
  async getQualifications(): Promise<QualificationDto[]> {
    /**
     * TODO: Refactor this endpoint to support pagination
     */
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
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @Delete('/:reference')
  @HttpCode(204)
  async deleteQualification(
    @Param('reference') reference: string,
  ): Promise<void> {
    await this.qualificationService.delete(reference);
  }

  @ApiOperation({ summary: 'Assign a qualification to users' })
  @ApiBody({ type: AssignQualificationDto })
  @ApiResponse({
    status: 200,
    description: 'Qualification assigned successfully',
  })
  @ApiResponse({ status: 422, description: 'No users found for operation' })
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @Post('/:reference/assign')
  @HttpCode(200)
  async assign(
    @Param('reference') reference: string,
    @Body() assignQualificationDto: AssignQualificationDto,
  ): Promise<void> {
    await this.qualificationService.assign(
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
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @Post('/:reference/unassign')
  @HttpCode(200)
  async unassign(
    @Param('reference') reference: string,
    @Body() unassignQualificationDto: UnassignQualificationDto,
  ): Promise<void> {
    await this.qualificationService.unassign(
      reference,
      unassignQualificationDto.workerAddresses,
    );
  }
}
