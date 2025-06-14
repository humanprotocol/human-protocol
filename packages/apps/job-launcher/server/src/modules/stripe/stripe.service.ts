import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeConfigService } from '../../common/config/stripe-config.service';
import { NotFoundError, ServerError } from '../../common/errors';
import { ErrorPayment } from '../../common/constants/errors';
import { VatType } from '../../common/enums/payment';
import {
  PaymentProvider,
  PaymentMethod,
  CustomerData,
  TaxId,
  Invoice,
  PaymentIntent,
  SetupIntent,
} from '../payment/payment-provider.abstract';

@Injectable()
export class StripeService extends PaymentProvider {
  private stripe: Stripe;

  constructor(private stripeConfigService: StripeConfigService) {
    super();

    this.stripe = new Stripe(this.stripeConfigService.secretKey, {
      apiVersion: this.stripeConfigService.apiVersion as any,
      appInfo: {
        name: this.stripeConfigService.appName,
        version: this.stripeConfigService.appVersion,
        url: this.stripeConfigService.appInfoURL,
      },
    });
  }

  async createCustomer(email: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({ email });
      return customer.id;
    } catch (error) {
      this.logger.log(error.message, StripeService.name);
      throw new ServerError(ErrorPayment.CustomerNotCreated);
    }
  }

  async createSetupIntent(customerId: string | null): Promise<string> {
    let setupIntent: Stripe.Response<Stripe.SetupIntent>;

    try {
      setupIntent = await this.stripe.setupIntents.create({
        automatic_payment_methods: { enabled: true },
        customer: customerId ?? undefined,
      });
    } catch (error) {
      this.logger.log(error.message, StripeService.name);
      throw new ServerError(ErrorPayment.CardNotAssigned);
    }

    if (!setupIntent?.client_secret) {
      this.logger.log(
        ErrorPayment.ClientSecretDoesNotExist,
        StripeService.name,
      );
      throw new ServerError(ErrorPayment.ClientSecretDoesNotExist);
    }

    return setupIntent.client_secret;
  }

  async createInvoice(
    customerId: string,
    amountInCents: number,
    currency: string,
    description: string,
  ): Promise<Invoice> {
    let invoice = await this.stripe.invoices.create({
      customer: customerId,
      currency: currency,
      auto_advance: false,
      payment_settings: {
        payment_method_types: ['card'],
      },
    });

    await this.stripe.invoiceItems.create({
      customer: customerId,
      amount: amountInCents,
      invoice: invoice.id,
      description: description,
    });

    invoice = await this.stripe.invoices.finalizeInvoice(invoice.id);

    if (!invoice.payment_intent) {
      throw new ServerError(ErrorPayment.IntentNotCreated);
    }

    return {
      id: invoice.id,
      payment_intent: invoice.payment_intent as string,
      status: invoice.status?.toString(),
      amount_due: invoice.amount_due,
      currency: invoice.currency,
    };
  }

  async handlePaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
    offSession: boolean,
  ): Promise<PaymentIntent> {
    try {
      if (offSession) {
        await this.stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: paymentMethodId,
          off_session: true,
        });
      } else {
        await this.stripe.paymentIntents.update(paymentIntentId, {
          payment_method: paymentMethodId,
        });
      }
    } catch {
      throw new ServerError(ErrorPayment.PaymentMethodAssociationFailed);
    }

    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent?.client_secret) {
      throw new ServerError(ErrorPayment.ClientSecretDoesNotExist);
    }

    return {
      id: paymentIntent.id,
      customer: paymentIntent.customer as string,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      amount_received: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      latest_charge: paymentIntent.latest_charge as string,
    };
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    if (!paymentIntent.client_secret) {
      throw new ServerError(ErrorPayment.ClientSecretDoesNotExist);
    }

    return {
      id: paymentIntent.id,
      customer: paymentIntent.customer as string,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      amount_received: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      latest_charge: paymentIntent.latest_charge as string,
    };
  }

  async retrieveCustomer(customerId: string): Promise<CustomerData> {
    const customer = (await this.stripe.customers.retrieve(
      customerId,
    )) as Stripe.Customer;

    return {
      email: customer.email!,
      name: customer.name ?? undefined,
      address: customer.address
        ? {
            line1: customer.address.line1 ?? undefined,
            city: customer.address.city ?? undefined,
            country: customer.address.country ?? undefined,
            postal_code: customer.address.postal_code ?? undefined,
          }
        : undefined,
      default_payment_method: customer.invoice_settings
        .default_payment_method as string,
    };
  }

  async getDefaultPaymentMethod(customerId: string): Promise<string | null> {
    const customer = await this.retrieveCustomer(customerId);
    return customer.default_payment_method ?? null;
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const paymentMethods = await this.stripe.customers.listPaymentMethods(
      customerId,
      { type: 'card', limit: 100 },
    );

    const defaultPaymentMethod = await this.getDefaultPaymentMethod(customerId);

    return paymentMethods.data.map((method) => ({
      id: method.id,
      brand: method.card?.brand as string,
      last4: method.card?.last4 as string,
      expMonth: method.card?.exp_month as number,
      expYear: method.card?.exp_year as number,
      default: defaultPaymentMethod === method.id,
    }));
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    const paymentMethod =
      await this.stripe.paymentMethods.detach(paymentMethodId);

    return {
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand as string,
      last4: paymentMethod.card?.last4 as string,
      expMonth: paymentMethod.card?.exp_month as number,
      expYear: paymentMethod.card?.exp_year as number,
      default: false,
    };
  }

  async retrievePaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    const paymentMethod =
      await this.stripe.paymentMethods.retrieve(paymentMethodId);

    return {
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand as string,
      last4: paymentMethod.card?.last4 as string,
      expMonth: paymentMethod.card?.exp_month as number,
      expYear: paymentMethod.card?.exp_year as number,
      default: false, // We don't know if it's default without customer context
    };
  }

  async updateCustomer(
    customerId: string,
    data: Partial<CustomerData>,
  ): Promise<CustomerData> {
    const params = data.default_payment_method
      ? {
          ...data,
          invoice_settings: {
            default_payment_method: data.default_payment_method,
          },
        }
      : data;

    const customer = (await this.stripe.customers.update(
      customerId,
      params,
    )) as Stripe.Customer;

    return {
      email: customer.email!,
      name: customer.name ?? undefined,
      address: customer.address
        ? {
            line1: customer.address.line1 ?? undefined,
            city: customer.address.city ?? undefined,
            country: customer.address.country ?? undefined,
            postal_code: customer.address.postal_code ?? undefined,
          }
        : undefined,
      default_payment_method: customer.invoice_settings
        .default_payment_method as string,
    };
  }

  async listCustomerTaxIds(customerId: string): Promise<TaxId[]> {
    const taxIds = await this.stripe.customers.listTaxIds(customerId);

    return taxIds.data.map((taxId) => ({
      id: taxId.id,
      type: taxId.type as VatType,
      value: taxId.value,
    }));
  }

  async createTaxId(
    customerId: string,
    type: VatType,
    value: string,
  ): Promise<TaxId> {
    const taxId = await this.stripe.customers.createTaxId(customerId, {
      type,
      value,
    });
    return {
      id: taxId.id,
      type: taxId.type as VatType,
      value: taxId.value,
    };
  }

  async deleteTaxId(customerId: string, taxIdId: string): Promise<void> {
    await this.stripe.customers.deleteTaxId(customerId, taxIdId);
  }

  async retrieveSetupIntent(setupIntentId: string): Promise<SetupIntent> {
    const setupIntent = await this.stripe.setupIntents.retrieve(setupIntentId);

    return {
      customer: setupIntent.customer as string,
      payment_method: setupIntent.payment_method as string,
    };
  }

  async retrieveCharge(chargeId: string): Promise<{ receipt_url: string }> {
    const charge = await this.stripe.charges.retrieve(chargeId);
    if (!charge.receipt_url) {
      throw new ServerError(ErrorPayment.NotFound);
    }
    return { receipt_url: charge.receipt_url };
  }
}
