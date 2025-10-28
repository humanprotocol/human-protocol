import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { ExchangeApiKeysService } from '../../modules/exchange-api-keys/exchange-api-keys.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import {
  DeleteExchangeApiKeysCommand,
  EnrollExchangeApiKeysCommand,
  EnrollExchangeApiKeysDto,
  RetrieveExchangeApiKeysCommand,
  RetrieveExchangeApiKeysResponse,
} from './model/exchange-api-keys.model';

@ApiTags('Exchange-Api-Keys')
@ApiBearerAuth()
@Controller('/exchange-api-keys')
export class ExchangeApiKeysController {
  constructor(
    private readonly service: ExchangeApiKeysService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({ summary: 'Enroll API keys for exchange' })
  @ApiBody({ type: EnrollExchangeApiKeysDto })
  @ApiResponse({ status: 200, description: 'Exchange API keys enrolled' })
  @HttpCode(200)
  @Post('/:exchange_name')
  async enroll(
    @Param('exchange_name') exchangeName: string,
    @Body() dto: EnrollExchangeApiKeysDto,
    @Request() req: RequestWithUser,
  ): Promise<{ id: number }> {
    const command = this.mapper.map(
      dto,
      EnrollExchangeApiKeysDto,
      EnrollExchangeApiKeysCommand,
    );
    command.token = req.token;
    command.exchangeName = exchangeName;
    return this.service.enroll(command);
  }

  @ApiOperation({ summary: 'Delete API keys for exchange' })
  @ApiResponse({ status: 204, description: 'Exchange API keys deleted' })
  @HttpCode(204)
  @Delete('/')
  async delete(@Request() req: RequestWithUser): Promise<void> {
    const command = new DeleteExchangeApiKeysCommand();
    command.token = req.token;
    await this.service.delete(command);
  }

  @ApiOperation({
    summary: 'Retrieve API keys for exchange',
  })
  @Get('/')
  async retrieve(
    @Request() req: RequestWithUser,
  ): Promise<RetrieveExchangeApiKeysResponse> {
    const command = new RetrieveExchangeApiKeysCommand();
    command.token = req.token;
    return this.service.retrieve(command);
  }
}
