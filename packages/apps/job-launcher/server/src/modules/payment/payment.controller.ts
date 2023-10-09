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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { HEADER_SIGNATURE_KEY } from 'src/common/constants';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Payment')
@Controller('/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/fiat')
  public async createFiatPayment(
    @Request() req: RequestWithUser,
    @Body() data: PaymentFiatCreateDto,
  ): Promise<string> {
    return this.paymentService.createFiatPayment(req.user.id, data);
  }

  @Post('/fiat/confirm-payment')
  public async confirmFiatPayment(
    @Request() req: RequestWithUser,
    @Body() data: PaymentFiatConfirmDto,
  ): Promise<boolean> {
    return this.paymentService.confirmFiatPayment(req.user.id, data);
  }

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

  @Get('/rates')
  public async getRate(@Query() data: GetRateDto): Promise<number> {
    try {
      return getRate(data.from, data.to);
    } catch (e) {
      throw new Error(e);
    }
  }
}
