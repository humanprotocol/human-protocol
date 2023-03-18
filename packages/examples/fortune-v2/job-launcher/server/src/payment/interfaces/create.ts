import Stripe from 'stripe';

export interface IPaymentCreateDto {
  amount: number,
  currency: string,
  paymentMethodType: string,
  paymentMethodOptions?: Stripe.PaymentIntentCreateParams.PaymentMethodOptions
}
