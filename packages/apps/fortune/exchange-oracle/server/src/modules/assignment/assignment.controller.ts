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
  AssignJobResponseDto,
  AssignmentDto,
  CreateAssignmentDto,
  GetAssignmentsDto,
  ResignDto,
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
  async createAssignment(
    @Request() req: RequestWithUser,
    @Body() body: CreateAssignmentDto,
  ): Promise<AssignJobResponseDto> {
    const assignment = await this.assignmentService.createAssignment(
      body,
      req.user,
    );

    const response: AssignJobResponseDto = {
      assignmentId: assignment.id.toString(),
      escrowAddress: body.escrowAddress,
      chainId: body.chainId,
      workerAddress: assignment.workerAddress,
    };
    return response;
  }

  @ApiOperation({
    summary: 'Get Assignments',
    description: 'Endpoint to retrieve a list of assignments.',
  })
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
  ): any {
    return this.assignmentService.getAssignmentList(
      query,
      req.user.address,
      req.user.reputationNetwork,
    );
  }

  @ApiOperation({
    summary: 'Resign Assignment',
    description: 'Endpoint to resign from a assignment.',
  })
  @ApiBearerAuth()
  @ApiBody({
    description: 'Details required to resign from the assginment.',
    type: ResignDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Job resigned successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Post('resign')
  resign(
    @Request() req: RequestWithUser,
    @Body() body: ResignDto,
  ): Promise<void> {
    return this.assignmentService.resign(
      Number(body.assignmentId),
      req.user.address,
    );
  }
}
