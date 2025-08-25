import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import {
  TokenRefreshCommand,
  TokenRefreshDto,
  TokenRefreshResponse,
} from './model/token-refresh.model';
import { TokenRefreshService } from './token-refresh.service';

@ApiTags('Refresh-Token')
@Public()
@Controller()
export class TokenRefreshController {
  constructor(
    private readonly service: TokenRefreshService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({ summary: 'Refresh token' })
  @HttpCode(200)
  @Post('/auth/refresh')
  async refreshToken(
    @Body() dto: TokenRefreshDto,
  ): Promise<TokenRefreshResponse> {
    const command = this.mapper.map(dto, TokenRefreshDto, TokenRefreshCommand);
    return this.service.refreshToken(command);
  }
}
