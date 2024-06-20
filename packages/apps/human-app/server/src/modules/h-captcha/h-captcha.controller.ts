import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HCaptchaService } from './h-captcha.service';
import {
  VerifyTokenCommand,
  VerifyTokenDto,
  VerifyTokenResponse,
} from './model/verify-token.model';
import {
  DailyHmtSpentCommand,
  DailyHmtSpentResponse,
} from './model/daily-hmt-spent.model';
import {
  Authorization,
  JwtPayload,
} from '../../common/config/params-decorators';
import { JwtUserData } from '../../common/interfaces/jwt-token.model';
import {
  EnableLabelingCommand,
  EnableLabelingResponse,
} from './model/enable-labeling.model';
import { UserStatsCommand, UserStatsResponse } from './model/user-stats.model';

@Controller('/labeling/h-captcha')
export class HCaptchaController {
  constructor(
    private readonly service: HCaptchaService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('h-captcha')
  @Post('/enable')
  @ApiOperation({ summary: 'Enables h-captcha labeling' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  public async enableLabeling(
    @Authorization() token: string,
  ): Promise<EnableLabelingResponse> {
    const command = {
      token: token,
    } as EnableLabelingCommand;
    return this.service.enableLabeling(command);
  }

  @ApiTags('h-captcha')
  @Post('/verify')
  @ApiOperation({ summary: 'Sends solution for verification' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  public async verifyToken(
    @Body() dto: VerifyTokenDto,
    @JwtPayload() jwtPayload: JwtUserData,
    @Authorization() jwtToken: string,
  ): Promise<VerifyTokenResponse> {
    const command = this.mapper.map(
      jwtPayload,
      JwtUserData,
      VerifyTokenCommand,
    );
    command.response = dto.token;
    command.jwtToken = jwtToken;
    return await this.service.verifyToken(command);
  }
  @ApiTags('h-captcha')
  @Get('/daily-hmt-spent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gets global daily HMT spent' })
  @UsePipes(new ValidationPipe())
  public async getDailyHmtSpent(
    @JwtPayload() jwtPayload: JwtUserData,
  ): Promise<DailyHmtSpentResponse> {
    const command = this.mapper.map(
      jwtPayload,
      JwtUserData,
      DailyHmtSpentCommand,
    );
    return this.service.getDailyHmtSpent(command);
  }
  @ApiTags('h-captcha')
  @Get('/user-stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gets stats per user' })
  @UsePipes(new ValidationPipe())
  public async getUserStats(
    @JwtPayload() jwtPayload: JwtUserData,
  ): Promise<UserStatsResponse> {
    const command = this.mapper.map(jwtPayload, JwtUserData, UserStatsCommand);
    return this.service.getUserStats(command);
  }
}
