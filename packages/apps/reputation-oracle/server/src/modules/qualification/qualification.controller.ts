import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  CreateQualificationDto,
  AssignQualificationDto,
  UnassignQualificationDto,
} from './qualification.dto';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesAuthGuard } from '../../common/guards';
import { QualificationService } from './qualification.service';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums/user';

@ApiTags('Qualification')
@Controller('qualification')
@ApiBearerAuth()
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new qualification' })
  @ApiBody({ type: CreateQualificationDto })
  @ApiResponse({
    status: 201,
    description: 'Qualification created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createQualificationDto: CreateQualificationDto) {
    return this.qualificationService.createQualification(
      createQualificationDto,
    );
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get list of qualifications' })
  @ApiResponse({ status: 200, description: 'List of qualifications' })
  getQualifications() {
    return this.qualificationService.getQualifications();
  }

  @Post('/assign')
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @HttpCode(201)
  @ApiOperation({ summary: 'Assign a qualification to users' })
  @ApiBody({ type: AssignQualificationDto })
  @ApiResponse({
    status: 201,
    description: 'Qualification assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  assign(@Body() assignQualificationDto: AssignQualificationDto) {
    return this.qualificationService.assign(assignQualificationDto);
  }

  @Delete('/unassign')
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Unassign a qualification from users' })
  @ApiBody({ type: UnassignQualificationDto })
  @ApiResponse({
    status: 200,
    description: 'Qualification unassigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  unassign(@Body() unassignQualificationDto: UnassignQualificationDto) {
    return this.qualificationService.unassign(unassignQualificationDto);
  }

  @Delete('/:reference')
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(Role.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a qualification' })
  @ApiResponse({
    status: 200,
    description: 'Qualification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Qualification not found' })
  delete(@Param('reference') reference: string) {
    return this.qualificationService.delete(reference);
  }
}
