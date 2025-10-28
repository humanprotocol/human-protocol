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
  getSchemaPath,
} from '@nestjs/swagger';

import type { RequestWithUser } from '@/common/types';
import Environment from '@/utils/environment';

import {
  ExchangeNameParamDto,
  EnrollExchangeApiKeysDto,
  EnrollExchangeApiKeysResponseDto,
  EnrolledApiKeyDto,
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
    summary: 'Retrieve enrolled exchange with api key',
    description: 'Returns the enrolled api key for exchange w/o secret key',
  })
  @ApiResponse({
    status: 200,
    schema: {
      nullable: true,
      allOf: [{ $ref: getSchemaPath(EnrolledApiKeyDto) }],
    },
  })
  @Get('/')
  async retrieveEnrolledApiKeys(
    @Req() request: RequestWithUser,
  ): Promise<EnrolledApiKeyDto | null> {
    const userId = request.user.id;

    return this.exchangeApiKeysService.retrievedEnrolledApiKey(userId);
  }

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
    @Param() params: ExchangeNameParamDto,
    @Body() data: EnrollExchangeApiKeysDto,
  ): Promise<EnrollExchangeApiKeysResponseDto> {
    const key = await this.exchangeApiKeysService.enroll({
      userId: request.user.id,
      exchangeName: params.exchangeName,
      apiKey: data.apiKey,
      secretKey: data.secretKey,
    });

    return { id: key.id };
  }

  @ApiOperation({
    summary: 'Delete API keys',
  })
  @ApiResponse({
    status: 204,
    description: 'Exchange API keys deleted',
  })
  @HttpCode(204)
  @Delete('/')
  async delete(@Req() request: RequestWithUser): Promise<void> {
    await this.exchangeApiKeysRepository.deleteByUser(request.user.id);
  }

  @ApiOperation({
    summary: 'Retreive API keys for exchange',
    description:
      'This functionality is purely for dev solely and works only in non-production environments',
  })
  @Get('/exchange')
  async retrieve(@Req() request: RequestWithUser): Promise<unknown> {
    if (!Environment.isDevelopment()) {
      throw new ForbiddenException();
    }

    return this.exchangeApiKeysService.retrieve(request.user.id);
  }
}
