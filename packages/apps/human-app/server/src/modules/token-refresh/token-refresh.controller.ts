import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { TokenRefreshService } from './token-refresh.service';
import {
  TokenRefreshCommand,
  TokenRefreshDto,
} from './model/token-refresh.model';
import { TokenRefreshResponse } from './model/token-refresh.model';

@Controller()
export class TokenRefreshController {
  constructor(
    private readonly service: TokenRefreshService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Refresh-Token')
  @Post('/auth/refresh')
  @ApiOperation({ summary: 'Refresh token' })
  @UsePipes(new ValidationPipe())
  public refreshToken(
    @Body() dto: TokenRefreshDto,
  ): Promise<TokenRefreshResponse> {
    const command = this.mapper.map(dto, TokenRefreshDto, TokenRefreshCommand);
    return this.service.refreshToken(command);
  }
}
