import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { JwtUserData } from '../../common/utils/jwt-token.model';
import { HCaptchaService } from './h-captcha.service';
import {
  DailyHmtSpentCommand,
  DailyHmtSpentResponse,
} from './model/daily-hmt-spent.model';
import {
  EnableLabelingCommand,
  EnableLabelingResponse,
} from './model/enable-labeling.model';
import { UserStatsCommand, UserStatsResponse } from './model/user-stats.model';
import {
  VerifyTokenCommand,
  VerifyTokenDto,
  VerifyTokenResponse,
} from './model/verify-token.model';

@ApiTags('h-captcha')
@ApiBearerAuth()
@Controller('/labeling/h-captcha')
export class HCaptchaController {
  constructor(
    private readonly service: HCaptchaService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({ summary: 'Enables h-captcha labeling' })
  @Post('/enable')
  public async enableLabeling(
    @Request() req: RequestWithUser,
  ): Promise<EnableLabelingResponse> {
    const command = {
      token: req.token,
    } as EnableLabelingCommand;
    return this.service.enableLabeling(command);
  }

  @ApiOperation({ summary: 'Sends solution for verification' })
  @Post('/verify')
  public async verifyToken(
    @Body() dto: VerifyTokenDto,
    @Request() req: RequestWithUser,
  ): Promise<VerifyTokenResponse> {
    if (!req.user.site_key) {
      throw new BadRequestException('Labeling is not set up');
    }
    const command = this.mapper.map(req.user, JwtUserData, VerifyTokenCommand);
    command.response = dto.token;
    command.jwtToken = req.token;
    return await this.service.verifyToken(command);
  }

  @ApiOperation({ summary: 'Gets global daily HMT spent' })
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/daily-hmt-spent')
  public async getDailyHmtSpent(
    @Request() req: RequestWithUser,
  ): Promise<DailyHmtSpentResponse> {
    if (!req.user.site_key) {
      throw new BadRequestException('Labeling is not set up');
    }
    const command = this.mapper.map(
      req.user,
      JwtUserData,
      DailyHmtSpentCommand,
    );
    return this.service.getDailyHmtSpent(command);
  }

  @ApiOperation({ summary: 'Gets stats per user' })
  @Header('Cache-Control', 'public, max-age=60')
  @Get('/user-stats')
  public async getUserStats(
    @Request() req: RequestWithUser,
  ): Promise<UserStatsResponse> {
    if (!req.user.email || !req.user.site_key) {
      throw new BadRequestException('Labeling is not set up');
    }
    const command = this.mapper.map(req.user, JwtUserData, UserStatsCommand);
    return this.service.getUserStats(command);
  }
}
