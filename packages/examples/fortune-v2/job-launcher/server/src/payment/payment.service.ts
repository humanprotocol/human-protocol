import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;
 
  constructor(
    private configService: ConfigService
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY', 'secrete-key'), {
      apiVersion: this.configService.get('STRIPE_API_VERSION', '2022-11-15'),
      appInfo: {
        name: this.configService.get('NAME', 'Fortune'),
        version: this.configService.get('VERSION'),
        url: this.configService.get('STRIPE_APP_INFO_URL'),
      },
    });
  }

  public async createCustomer(name: string, email: string) {
    return this.stripe.customers.create({
      name,
      email
    });
  }
}
