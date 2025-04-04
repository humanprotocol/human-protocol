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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorization } from '../../common/config/params-decorators';
import { AbuseService } from './abuse.service';
import {
  ReportedAbuseResponse,
  ReportAbuseCommand,
  ReportAbuseDto,
} from './model/abuse.model';

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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve all abuse entities created by the authenticated user',
  })
  public async getUserAbuseReports(
    @Authorization() token: string,
  ): Promise<ReportedAbuseResponse> {
    return this.service.getUserAbuseReports(token);
  }
}
