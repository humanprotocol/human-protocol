import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '../../common/config/params-decorators';
import { AbuseService } from './abuse.service';
import {
  ReportedAbuseResponse,
  ReportAbuseCommand,
  ReportAbuseDto,
} from './model/abuse.model';

@ApiBearerAuth()
@ApiTags('Abuse')
@Controller('/abuse')
export class AbuseController {
  constructor(
    private readonly service: AbuseService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Post('/report')
  @ApiOperation({
    summary: 'Report an identified abuse',
  })
  @ApiResponse({
    status: 200,
    description: 'Abuse report successfully submitted',
  })
  @UsePipes(new ValidationPipe())
  public async reportAbuse(
    @Body() AbuseDto: ReportAbuseDto,
    @Authorization() token: string,
  ): Promise<void> {
    const AbuseCommand = this.mapper.map(
      AbuseDto,
      ReportAbuseDto,
      ReportAbuseCommand,
    );
    AbuseCommand.token = token;
    return this.service.reportAbuse(AbuseCommand);
  }

  @Get('/reports')
  @ApiOperation({
    summary: 'Retrieve all abuse entities created by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of abuse reports',
    type: ReportedAbuseResponse,
  })
  public async getUserAbuseReports(
    @Authorization() token: string,
  ): Promise<ReportedAbuseResponse> {
    return this.service.getUserAbuseReports(token);
  }
}
