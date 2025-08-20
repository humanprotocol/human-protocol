import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Header, HttpCode, Query } from '@nestjs/common';

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

  @ApiOperation({
    summary: 'Get current HMT price',
    description: 'Endpoint to return a current HMT price.',
  })
  @ApiResponse({
    status: 200,
    description: 'Price retrieved successfully',
    type: HmtPriceDto,
  })
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/hmt-price')
  @HttpCode(200)
  async hmtPrice(): Promise<HmtPriceDto> {
    const hmtPrice = await this.statsService.hmtPrice();
    return { hmtPrice };
  }

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
  @Header('Cache-Control', 'public, max-age=600')
  @HttpCode(200)
  @Get('/hcaptcha/daily')
  async hcaptchaDailyStats(
    @Query('from', DateValidationPipe) from: string,
    @Query('to', DateValidationPipe) to: string,
  ): Promise<HcaptchaDailyStatsResponseDto> {
    const results = await this.statsService.hCaptchaStats(from, to);
    return { from, to, results };
  }

  @ApiOperation({
    summary: 'Get Hcaptcha general stats',
    description: 'Endpoint to return Hcaptcha general stats.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stats retrieved successfully',
    type: HcaptchaStats,
  })
  @Header('Cache-Control', 'public, max-age=600')
  @HttpCode(200)
  @Get('/hcaptcha/general')
  async hcaptchaGeneralStats(): Promise<HcaptchaStats> {
    const result: HcaptchaStats =
      await this.statsService.hCaptchaGeneralStats();
    return result;
  }

  @ApiOperation({
    summary: 'Get HMT general stats',
    description: 'Endpoint to return HMT general stats.',
  })
  @ApiResponse({
    status: 200,
    description: 'General stats retrieved successfully',
    type: HmtGeneralStatsDto,
  })
  @Header('Cache-Control', 'public, max-age=600')
  @HttpCode(200)
  @Get('/general')
  async hmtGeneral(): Promise<HmtGeneralStatsDto> {
    const results: HmtGeneralStatsDto =
      await this.statsService.hmtGeneralStats();
    return results;
  }

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
  @Header('Cache-Control', 'public, max-age=600')
  @HttpCode(200)
  @Get('/hmt/daily')
  async hmtDailyStats(
    @Query('from', DateValidationPipe) from: string,
    @Query('to', DateValidationPipe) to: string,
  ): Promise<HmtDailyStatsResponseDto> {
    const results = await this.statsService.hmtDailyStats(from, to);
    return { from, to, results };
  }
}
