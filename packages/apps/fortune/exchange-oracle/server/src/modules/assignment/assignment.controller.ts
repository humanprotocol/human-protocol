import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { AssignmentService } from './assignment.service';
import {
  AssignmentDto,
  CreateAssignmentDto,
  GetAssignmentsDto,
} from './assignment.dto';
import { RequestWithUser } from '../../common/types/jwt';
import { PageDto } from '../../common/pagination/pagination.dto';

@ApiTags('Assignment')
@Controller('assignment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @ApiOperation({
    summary: 'Create Assignment',
    description: 'Endpoint to create a new assignment.',
  })
  @ApiBody({
    description: 'Details of the assignment to be created.',
    type: CreateAssignmentDto,
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Assignment created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Post()
  createAssignment(
    @Request() req: RequestWithUser,
    @Body() body: CreateAssignmentDto,
  ): Promise<void> {
    return this.assignmentService.createAssignment(body, req.user);
  }

  @ApiOperation({
    summary: 'Get Assignments',
    description: 'Endpoint to retrieve a list of assignments.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of assignments retrieved successfully.',
    type: PageDto<AssignmentDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Get()
  getAssignments(
    @Request() req: RequestWithUser,
    @Query() query: GetAssignmentsDto,
  ): Promise<PageDto<AssignmentDto>> {
    const serverUrl = (req.headers as any).referer.slice(
      0,
      (req.headers as any).referer.indexOf(
        '/',
        (req.headers as any).referer.indexOf('//') + 2,
      ) + 1,
    );
    return this.assignmentService.getAssignmentList(
      query,
      req.user.address,
      req.user.reputationNetwork,
      serverUrl,
    );
  }
}
