import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { RequestWithUser } from '@/common/types';
import Environment from '@/utils/environment';

import {
  EncrollExchangeApiKeysParamsDto,
  EnrollExchangeApiKeysDto,
  EnrollExchangeApiKeysResponseDto,
  ExchangeNameParamDto,
} from './exchange-api-keys.dto';
import { ExchangeApiKeysControllerErrorsFilter } from './exchange-api-keys.error-filter';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { ExchangeApiKeysService } from './exchange-api-keys.service';

@ApiTags('Exchange API Keys')
@ApiBearerAuth()
@UseFilters(ExchangeApiKeysControllerErrorsFilter)
@Controller('exchange-api-keys')
export class ExchangeApiKeysController {
  constructor(
    private readonly exchangeApiKeysService: ExchangeApiKeysService,
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
  ) {}

  @ApiOperation({
    summary: 'Enroll API keys for exchange',
    description:
      'Enrolls API keys for provided exchange. If keys already exist for exchange - updates them',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange API keys enrolled',
    type: EnrollExchangeApiKeysResponseDto,
  })
  @ApiBody({ type: EnrollExchangeApiKeysDto })
  @HttpCode(200)
  @Post('/:exchange_name')
  async enroll(
    @Req() request: RequestWithUser,
    @Param() params: EncrollExchangeApiKeysParamsDto,
    @Body() data: EnrollExchangeApiKeysDto,
  ): Promise<EnrollExchangeApiKeysResponseDto> {
    const userId = request.user.id;
    const exchangeName = params.exchangeName;

    const key = await this.exchangeApiKeysService.enroll({
      userId,
      exchangeName,
      apiKey: data.apiKey,
      secretKey: data.secretKey,
    });

    return { id: key.id };
  }

  @ApiOperation({
    summary: 'Delete API keys for exchange',
  })
  @ApiResponse({
    status: 204,
    description: 'Exchange API keys deleted',
  })
  @HttpCode(204)
  @Delete('/:exchange_name')
  async delete(
    @Req() request: RequestWithUser,
    @Param() params: EncrollExchangeApiKeysParamsDto,
  ): Promise<void> {
    const userId = request.user.id;
    const exchangeName = params.exchangeName;

    await this.exchangeApiKeysRepository.deleteByUserAndExchange(
      userId,
      exchangeName,
    );
  }

  @ApiOperation({
    summary: 'Retreive API keys for exchange',
    description:
      'This functionality is purely for dev solely and works only in non-production environments',
  })
  @Get('/:exchange_name')
  async retrieve(
    @Req() request: RequestWithUser,
    @Param() params: ExchangeNameParamDto,
  ): Promise<unknown> {
    if (!Environment.isDevelopment()) {
      throw new ForbiddenException();
    }

    const userId = request.user.id;
    const exchangeName = params.exchangeName;

    return this.exchangeApiKeysService.retrieve(userId, exchangeName);
  }
}
