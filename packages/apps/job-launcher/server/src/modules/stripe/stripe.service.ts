import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeConfigService } from '../../common/config/stripe-config.service';
import { ServerError } from '../../common/errors';
import { ErrorPayment } from '../../common/constants/errors';
import { VatType } from '../../common/enums/payment';

@Injectable()
export class StripeService {
  
  private readonly logger = new Logger(StripeService.name);

  private stripe: Stripe;

  constructor(private stripeConfigService: StripeConfigService) {
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

  async createSetupIntentAndReturnSecret(customerId: string): Promise<string> {
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
      this.logger.log(ErrorPayment.ClientSecretDoesNotExist, StripeService.name);
      throw new ServerError(ErrorPayment.ClientSecretDoesNotExist);
    }

    return setupIntent.client_secret;
  }

  async createInvoice(customerId: string, amountInCents: number, currency: string, description: string): Promise<Stripe.Invoice> {
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

    return invoice;
  }

  async handlePaymentIntent(paymentIntentId: string, paymentMethodId: string, offSession: boolean): Promise<Stripe.PaymentIntent> {
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

    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent?.client_secret) {
      throw new ServerError(ErrorPayment.ClientSecretDoesNotExist);
    }

    return paymentIntent;
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    return (await this.stripe.customers.retrieve(customerId)) as Stripe.Customer;
  }

  async getDefaultPaymentMethod(customerId: string): Promise<string | null> {
    const customer = await this.retrieveCustomer(customerId);

    return customer.invoice_settings.default_payment_method as string;
  }

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.customers.listPaymentMethods(
      customerId,
      { type: 'card', limit: 100 },
    );

    return paymentMethods.data;
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return this.stripe.paymentMethods.retrieve(paymentMethodId);
  }

  async updateCustomer(
    customerId: string,
    data: Partial<{
      address: {
        line1?: string;
        city?: string;
        country?: string;
        postal_code?: string;
      };
      name?: string;
      email?: string;
      invoice_settings?: Partial<{
        default_payment_method?: string;
      }>;
    }>,
  ): Promise<Stripe.Customer> {
    return this.stripe.customers.update(customerId, data);
  }

  async listCustomerTaxIds(customerId: string): Promise<Stripe.TaxId[]> {
    const taxIds = await this.stripe.customers.listTaxIds(customerId);
    return taxIds.data;
  }

  async deleteTaxId(customerId: string, taxId: string): Promise<void> {
    await this.stripe.customers.deleteTaxId(customerId, taxId);
  }

  async createTaxId(customerId: string, type: VatType, value: string): Promise<Stripe.TaxId> {
    return this.stripe.customers.createTaxId(customerId, {
      type,
      value,
    });
  }

  async retrieveSetupIntent(setupIntentId: string): Promise<Stripe.SetupIntent> {
    return this.stripe.setupIntents.retrieve(setupIntentId);
  }

  async retrieveCharge(chargeId: string): Promise<Stripe.Charge> {
    return this.stripe.charges.retrieve(chargeId);
  }
} 