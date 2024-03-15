import { AssignmentService } from './assignment.service';
import { AssignmentStatsDto } from './assignment.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { RequestWithUser } from '../../common/types/jwt';

@ApiTags('Stats')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get('assignment')
  async getAssignmentStats(
    @Request() req: RequestWithUser,
  ): Promise<AssignmentStatsDto> {
    return this.assignmentService.getAssignmentStats(req.user.address);
  }
}