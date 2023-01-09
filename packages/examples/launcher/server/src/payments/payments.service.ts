import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { IPaymentRequestDto } from './interfaces';

@Injectable()
export class PaymentsService {
  private stripe;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>("STRIPE_API_KEY", ""), {
      apiVersion: '2020-08-27',
    });
  }

  createPayment(paymentRequestBody: IPaymentRequestDto): Promise<any> {
    return this.stripe.paymentIntents.create({
      amount: paymentRequestBody.price * 100,
      currency: paymentRequestBody.currency,
    });
  }
}
