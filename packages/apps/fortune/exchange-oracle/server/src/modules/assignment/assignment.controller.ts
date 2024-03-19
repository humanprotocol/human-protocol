import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto, GetAssignmentsDto } from './assignment.dto';
import { RequestWithUser } from '../../common/types/jwt';

@ApiTags('Assignment')
@Controller('assignment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  createAssignment(
    @Request() req: RequestWithUser,
    @Body() body: CreateAssignmentDto,
  ): Promise<any> {
    return this.assignmentService.createAssignment(body, req.user);
  }

  @Get()
  getJobs(
    @Request() req: RequestWithUser,
    @Query() query: GetAssignmentsDto,
  ): Promise<any> {
    return this.assignmentService.getAssignmentList(
      query,
      req.user.reputationNetwork,
    );
  }
}
