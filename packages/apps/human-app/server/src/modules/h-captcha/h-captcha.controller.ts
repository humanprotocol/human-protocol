import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
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
@UseGuards(JwtAuthGuard)
@Controller('/labeling/h-captcha')
export class HCaptchaController {
  constructor(
    private readonly service: HCaptchaService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Post('/enable')
  @ApiOperation({ summary: 'Enables h-captcha labeling' })
  public async enableLabeling(
    @Request() req: RequestWithUser,
  ): Promise<EnableLabelingResponse> {
    const command = {
      token: req.token,
    } as EnableLabelingCommand;
    return this.service.enableLabeling(command);
  }

  @Post('/verify')
  @ApiOperation({ summary: 'Sends solution for verification' })
  public async verifyToken(
    @Body() dto: VerifyTokenDto,
    @Request() req: RequestWithUser,
  ): Promise<VerifyTokenResponse> {
    const command = this.mapper.map(req.user, JwtUserData, VerifyTokenCommand);
    command.response = dto.token;
    command.jwtToken = req.token;
    return await this.service.verifyToken(command);
  }

  @Get('/daily-hmt-spent')
  @ApiOperation({ summary: 'Gets global daily HMT spent' })
  public async getDailyHmtSpent(
    @Request() req: RequestWithUser,
  ): Promise<DailyHmtSpentResponse> {
    const command = this.mapper.map(
      req.user,
      JwtUserData,
      DailyHmtSpentCommand,
    );
    return this.service.getDailyHmtSpent(command);
  }

  @Get('/user-stats')
  @ApiOperation({ summary: 'Gets stats per user' })
  public async getUserStats(
    @Request() req: RequestWithUser,
  ): Promise<UserStatsResponse> {
    const command = this.mapper.map(req.user, JwtUserData, UserStatsCommand);
    return this.service.getUserStats(command);
  }
}
