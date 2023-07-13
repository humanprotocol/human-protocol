import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards';

import { PaymentService } from './payment.service';
import {
  GetRateDto,
  PaymentCryptoCreateDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
} from './payment.dto';
import { CurrencyService } from './currency.service';
import { IClientSecret, IPairRate, IResponseBool } from 'src/common/interfaces';

@ApiBearerAuth()
@ApiTags('Payment')
@Controller('/payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly currencyService: CurrencyService,
  ) {}

  @UseGuards(RolesGuard)
  @Post('/fiat')
  public async createFiatPayment(
    @Request() req: any,
    @Body() data: PaymentFiatCreateDto,
  ): Promise<IClientSecret> {
    return this.paymentService.createFiatPayment(
      req.user?.stripeCustomerId,
      data,
    );
  }

  @UseGuards(RolesGuard)
  @Post('/fiat/confirm-payment')
  public async confirmFiatPayment(
    @Request() req: any,
    @Body() data: PaymentFiatConfirmDto,
  ): Promise<IResponseBool> {
    return this.paymentService.confirmFiatPayment(req.user?.id, data);
  }

  @UseGuards(RolesGuard)
  @Post('/crypto')
  public async createCryptoPayment(
    @Request() req: any,
    @Body() data: PaymentCryptoCreateDto,
  ): Promise<IResponseBool> {
    return this.paymentService.createCryptoPayment(req.user?.id, data);
  }

  @UseGuards(RolesGuard)
  @Get('/rates')
  public async getRate(@Query() data: GetRateDto): Promise<IPairRate> {
    try {
      return this.currencyService.getRate(data.token, data.currency);
    } catch (e) {
      throw new Error(e)
    }
  }
}
