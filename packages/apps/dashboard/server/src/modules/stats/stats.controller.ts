import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, HttpCode, Query } from '@nestjs/common';

import { StatsService } from './stats.service';
import { HmtPriceDto } from './dto/hmt-price.dto';
import {
  HcaptchaDailyStatsResponseDto,
  HcaptchaStats,
} from './dto/hcaptcha.dto';
import { HmtDailyStatsResponseDto } from './dto/hmt.dto';
import { DateValidationPipe } from '../../common/pipes/date-validation.pipe';
import { HmtGeneralStatsDto } from './dto/hmt-general-stats.dto';

@ApiTags('Stats')
@Controller('/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('/hmt-price')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get current HMT price',
    description: 'Endpoint to return a current HMT price.',
  })
  @ApiResponse({
    status: 200,
    description: 'Price retrieved successfully',
    type: HmtPriceDto,
  })
  public async hmtPrice(): Promise<HmtPriceDto> {
    const hmtPrice = await this.statsService.hmtPrice();
    return { hmtPrice };
  }

  @Get('/hcaptcha/daily')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get Hcaptcha stats',
    description: 'Endpoint to return Hcaptcha stats.',
  })
  @ApiQuery({
    name: 'from',
    type: String,
    description: 'Start date in the format YYYY-MM-DD',
    required: true,
  })
  @ApiQuery({
    name: 'to',
    type: String,
    description: 'End date in the format YYYY-MM-DD',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Stats retrieved successfully',
    type: HcaptchaDailyStatsResponseDto,
  })
  public async hcaptchaDailyStats(
    @Query('from', DateValidationPipe) from: string,
    @Query('to', DateValidationPipe) to: string,
  ): Promise<HcaptchaDailyStatsResponseDto> {
    const results = await this.statsService.hCaptchaStats(from, to);
    return { from, to, results };
  }

  @Get('/hcaptcha/general')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get Hcaptcha general stats',
    description: 'Endpoint to return Hcaptcha general stats.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stats retrieved successfully',
    type: HcaptchaStats,
  })
  public async hcaptchaGeneralStats(): Promise<HcaptchaStats> {
    const result: HcaptchaStats =
      await this.statsService.hCaptchaGeneralStats();
    return result;
  }

  @Get('/general')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get HMT general stats',
    description: 'Endpoint to return HMT general stats.',
  })
  @ApiResponse({
    status: 200,
    description: 'General stats retrieved successfully',
    type: HmtGeneralStatsDto,
  })
  public async hmtGeneral(): Promise<HmtGeneralStatsDto> {
    const results: HmtGeneralStatsDto =
      await this.statsService.hmtGeneralStats();
    return results;
  }

  @Get('/hmt/daily')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get HMT stats',
    description: 'Endpoint to return HMT stats.',
  })
  @ApiQuery({
    name: 'from',
    type: String,
    description: 'Start date in the format YYYY-MM-DD',
    required: true,
  })
  @ApiQuery({
    name: 'to',
    type: String,
    description: 'End date in the format YYYY-MM-DD',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Stats retrieved successfully',
    type: HmtDailyStatsResponseDto,
  })
  public async hmtDailyStats(
    @Query('from', DateValidationPipe) from: string,
    @Query('to', DateValidationPipe) to: string,
  ): Promise<HmtDailyStatsResponseDto> {
    const results = await this.statsService.hmtDailyStats(from, to);
    return { from, to, results };
  }
}
