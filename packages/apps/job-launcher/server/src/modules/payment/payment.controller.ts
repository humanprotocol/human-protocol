import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrencyService } from './currency.service';
import {
  GetRateDto,
  PaymentCryptoCreateDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
} from './payment.dto';
import { PaymentService } from './payment.service';

@ApiBearerAuth()
@ApiTags('Payment')
@Controller('/payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly currencyService: CurrencyService,
  ) {}

  @Post('/fiat')
  public async createFiatPayment(
    @Request() req: any,
    @Body() data: PaymentFiatCreateDto,
  ): Promise<string> {
    return this.paymentService.createFiatPayment(
      req.user?.stripeCustomerId,
      data,
    );
  }

  @Post('/fiat/confirm-payment')
  public async confirmFiatPayment(
    @Request() req: any,
    @Body() data: PaymentFiatConfirmDto,
  ): Promise<boolean> {
    return this.paymentService.confirmFiatPayment(req.user?.id, data);
  }

  @Post('/crypto')
  public async createCryptoPayment(
    @Request() req: any,
    @Body() data: PaymentCryptoCreateDto,
  ): Promise<boolean> {
    return this.paymentService.createCryptoPayment(req.user?.id, data);
  }

  @Get('/rates')
  public async getRate(@Query() data: GetRateDto): Promise<number> {
    try {
      return this.currencyService.getRate(data.token, data.currency);
    } catch (e) {
      throw new Error(e);
    }
  }
}
