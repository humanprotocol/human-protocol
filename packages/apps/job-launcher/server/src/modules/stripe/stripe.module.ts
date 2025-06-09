import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeConfigService } from '../../common/config/stripe-config.service';

@Module({
  providers: [StripeService, StripeConfigService],
  exports: [StripeService],
})
export class StripeModule {} 