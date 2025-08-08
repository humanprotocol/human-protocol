import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { AbuseService } from './abuse.service';
import {
  ReportAbuseCommand,
  ReportAbuseDto,
  ReportedAbuseResponse,
} from './model/abuse.model';

@ApiBearerAuth()
@ApiTags('Abuse')
@Controller('/abuse')
export class AbuseController {
  constructor(
    private readonly service: AbuseService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({
    summary: 'Report an identified abuse',
  })
  @ApiResponse({
    status: 200,
    description: 'Abuse report successfully submitted',
  })
  @HttpCode(200)
  @Post('/report')
  async reportAbuse(
    @Body() AbuseDto: ReportAbuseDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const AbuseCommand = this.mapper.map(
      AbuseDto,
      ReportAbuseDto,
      ReportAbuseCommand,
    );
    AbuseCommand.token = req.token;
    return this.service.reportAbuse(AbuseCommand);
  }

  @ApiOperation({
    summary: 'Retrieve all abuse entities created by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of abuse reports',
    type: ReportedAbuseResponse,
  })
  @Get('/reports')
  async getUserAbuseReports(
    @Request() req: RequestWithUser,
  ): Promise<ReportedAbuseResponse> {
    return this.service.getUserAbuseReports(req.token);
  }
}
