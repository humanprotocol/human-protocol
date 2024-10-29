import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  Headers,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';

import {
  GetRateDto,
  PaymentCryptoCreateDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
} from './payment.dto';
import { PaymentService } from './payment.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { ControlledError } from '../../common/errors/controlled';
import { ServerConfigService } from '../../common/config/server-config.service';
import { RateService } from './rate.service';
// import { WhitelistAuthGuard } from 'src/common/guards/whitelist.auth';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Payment')
@Controller('/payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly serverConfigService: ServerConfigService,
    private readonly rateService: RateService,
  ) {}

  @ApiOperation({
    summary: 'Create a fiat payment',
    description: 'Endpoint to create a new fiat payment.',
  })
  @ApiBody({ type: PaymentFiatCreateDto })
  @ApiResponse({
    status: 200,
    description: 'Payment created successfully',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Post('/fiat')
  public async createFiatPayment(
    @Body() data: PaymentFiatCreateDto,
    @Request() req: RequestWithUser,
  ): Promise<string> {
    return this.paymentService.createFiatPayment(req.user.id, data);
  }

  @ApiOperation({
    summary: 'Confirm a fiat payment',
    description: 'Endpoint to confirm a fiat payment.',
  })
  @ApiBody({ type: PaymentFiatConfirmDto })
  @ApiResponse({
    status: 200,
    description: 'Fiat payment confirmed successfully',
    type: Boolean,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Post('/fiat/confirm-payment')
  public async confirmFiatPayment(
    @Body() data: PaymentFiatConfirmDto,
    @Request() req: RequestWithUser,
  ): Promise<boolean> {
    return this.paymentService.confirmFiatPayment(req.user.id, data);
  }

  @ApiOperation({
    summary: 'Create a crypto payment',
    description: 'Endpoint to create a new crypto payment.',
  })
  @ApiBody({ type: PaymentCryptoCreateDto })
  @ApiResponse({
    status: 200,
    description: 'Crypto payment created successfully',
    type: Boolean,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Conflict with the current state of the server.',
  })
  // Disabled until billing system is active
  // @UseGuards(WhitelistAuthGuard)
  @Post('/crypto')
  public async createCryptoPayment(
    @Headers(HEADER_SIGNATURE_KEY) signature: string,
    @Body() data: PaymentCryptoCreateDto,
    @Request() req: RequestWithUser,
  ): Promise<boolean> {
    return this.paymentService.createCryptoPayment(
      req.user.id,
      data,
      signature,
    );
  }

  @ApiOperation({
    summary: 'Get exchange rates',
    description: 'Endpoint to get exchange rates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates retrieved successfully',
    type: Number,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/rates')
  public async getRate(@Query() data: GetRateDto): Promise<number> {
    try {
      return this.rateService.getRate(data.from, data.to);
    } catch (e) {
      throw new ControlledError(
        'Error getting rates',
        HttpStatus.CONFLICT,
        e.stack,
      );
    }
  }

  @ApiOperation({
    summary: 'Get Job Launcher minimum fee',
    description: 'Endpoint to get Job Launcher minimum fee in USD.',
  })
  @ApiResponse({
    status: 200,
    description: 'Minimum fee retrieved successfully',
    type: Number,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/min-fee')
  public async getMinFee(): Promise<number> {
    return this.serverConfigService.minimunFeeUsd;
  }
}
