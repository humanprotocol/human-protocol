import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import Stripe from 'stripe';
import { Repository } from "typeorm";
import { IPaymentConfirmDto } from "./interfaces";
import { PaymentEntity } from "./payment.entity";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;
  private endpointSecrete: string;
 
  constructor(
    private configService: ConfigService,
    @InjectRepository(PaymentEntity)
    private readonly paymentEntityRepository: Repository<PaymentEntity>,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY', 'secrete-key'), {
      apiVersion: this.configService.get('STRIPE_API_VERSION', '2022-11-15'),
      appInfo: {
        name: this.configService.get('NAME', 'Fortune'),
        version: this.configService.get('VERSION'),
        url: this.configService.get('STRIPE_APP_INFO_URL'),
      },
    });
    this.endpointSecrete = this.configService.get('STRIPE_ENDPOINT_SECRETE', "secrete-key")
  }

  public async createCustomer(name: string, email: string) {
    return this.stripe.customers.create({
      name,
      email
    });
  }

  public async createPaymentIntent(
    amount: number,
    currency: string,
    paymentMethodType: string,
    paymentMethodOptions: Stripe.PaymentIntentCreateParams.PaymentMethodOptions
  ) {
    const params: Stripe.PaymentIntentCreateParams = {
      payment_method_types: [paymentMethodType],
      amount: amount,
      currency: currency,
    };

    if (paymentMethodType === 'acss_debit') {
      params.payment_method_options = {
        acss_debit: {
          mandate_options: {
            payment_schedule: 'sporadic',
            transaction_type: 'personal',
          },
        },
      };
    } else if (paymentMethodType === 'konbini') {
      params.payment_method_options = {
        konbini: {
          product_description: 'Tシャツ',
          expires_after_days: 3,
        },
      };
    } else if (paymentMethodType === 'customer_balance') {
      params.payment_method_data = {
        type: 'customer_balance',
      };
      params.confirm = true;
      params.customer = await this.stripe.customers
        .create()
        .then((data) => data.id);
    }

    if (paymentMethodOptions) {
      params.payment_method_options = paymentMethodOptions;
    }
    
    const paymentIntent = await this.stripe.paymentIntents.create(params);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  public async webhookHandler(body: string, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      body,
      signature,
      this.endpointSecrete
    );
    return event;
  }

  public async confirmPayment(userId: number, dto: IPaymentConfirmDto) {
    // TODO
    this.getPayment(dto.paymentId)

    // TODO 
    // Send status
  }

  private async getPayment(paymentId: string) {
    return this.stripe.paymentIntents.retrieve(paymentId);
  }
}
