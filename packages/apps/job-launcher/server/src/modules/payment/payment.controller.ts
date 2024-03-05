import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  Headers,
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
import { getRate } from '../../common/utils';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Payment')
@Controller('/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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
    @Request() req: RequestWithUser,
    @Body() data: PaymentFiatCreateDto,
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
    @Request() req: RequestWithUser,
    @Body() data: PaymentFiatConfirmDto,
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
  @Post('/crypto')
  public async createCryptoPayment(
    @Headers(HEADER_SIGNATURE_KEY) signature: string,
    @Request() req: RequestWithUser,
    @Body() data: PaymentCryptoCreateDto,
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
      return getRate(data.from, data.to);
    } catch (e) {
      throw new Error(e);
    }
  }
}
