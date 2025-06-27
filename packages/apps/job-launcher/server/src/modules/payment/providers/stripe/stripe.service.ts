import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentProviderConfigService } from '../../../../common/config/payment-provider-config.service';
import { NotFoundError, ServerError } from '../../../../common/errors';
import { ErrorPayment } from '../../../../common/constants/errors';
import { PaymentStatus, VatType } from '../../../../common/enums/payment';
import {
  CardSetup,
  CustomerData,
  Invoice,
  PaymentData,
  PaymentMethod,
  TaxId,
} from '../../payment.interface';
import { PaymentProvider } from '../payment-provider.abstract';
import { AddressDto, BillingInfoDto } from '../../payment.dto';

export enum StripePaymentStatus {
  CANCELED = 'canceled',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  SUCCEEDED = 'succeeded',
}

@Injectable()
export class StripeService extends PaymentProvider {
  private stripe: Stripe;

  constructor(private stripeConfigService: PaymentProviderConfigService) {
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

  async setupCard(customerId: string | null): Promise<string> {
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
      paymentId: invoice.payment_intent as string,
      status: invoice.status?.toString(),
      amountDue: invoice.amount_due,
      currency: invoice.currency,
    };
  }

  async assignPaymentMethod(
    paymentIntentId: string,
    paymentMethodId: string,
    offSession: boolean,
  ): Promise<PaymentData> {
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

    const paymentIntent = await this.retrievePaymentIntent(paymentIntentId);

    if (!paymentIntent?.clientSecret) {
      throw new ServerError(ErrorPayment.ClientSecretDoesNotExist);
    }

    return paymentIntent;
  }

  async getReceiptUrl(paymentId: string, customerId: string): Promise<string> {
    const paymentIntent = await this.retrievePaymentIntent(paymentId);

    if (!paymentIntent || paymentIntent.customer !== customerId) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    const charge = await this.retrieveCharge(
      paymentIntent.latestCharge as string,
    );

    if (!charge || !charge.receipt_url) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    return charge.receipt_url;
  }

  async retrieveBillingInfo(
    customerId: string | null,
  ): Promise<BillingInfoDto | null> {
    if (!customerId) {
      return null;
    }

    const taxIds = await this.listCustomerTaxIds(customerId);

    const customer = await this.retrieveCustomer(customerId);

    const userBillingInfo = new BillingInfoDto();

    if (customer.address) {
      const address = new AddressDto();
      address.country = (customer.address.country as string).toLowerCase();
      address.postalCode = customer.address.postalCode as string;
      address.city = customer.address.city as string;
      address.line = customer.address.line1 as string;
      userBillingInfo.address = address;
    }

    userBillingInfo.name = customer.name as string;
    userBillingInfo.email = customer.email as string;
    userBillingInfo.vat = taxIds[0]?.value;
    userBillingInfo.vatType = taxIds[0]?.type as VatType;

    return userBillingInfo;
  }

  async updateBillingInfo(
    customerId: string,
    data: BillingInfoDto,
  ): Promise<CustomerData> {
    const existingTaxIds = await this.listCustomerTaxIds(customerId);

    for (const taxId of existingTaxIds) {
      await this.deleteTaxId(customerId, taxId.id);
    }

    // Create the new VAT tax ID
    if (data.vat && data.vatType) {
      await this.createTaxId(customerId, data.vatType, data.vat);
    }

    // If there are changes to the address, name, or email, update them
    if (data.address || data.name || data.email) {
      return this.updateCustomer(customerId, {
        address: {
          line1: data.address?.line,
          city: data.address?.city,
          country: data.address?.country,
          postalCode: data.address?.postalCode,
        },
        name: data.name,
        email: data.email,
      });
    }

    return this.retrieveCustomer(customerId);
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentData> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    let status: PaymentStatus | null;
    if (
      paymentIntent.status === StripePaymentStatus.CANCELED ||
      paymentIntent?.status === StripePaymentStatus.REQUIRES_PAYMENT_METHOD
    ) {
      status = PaymentStatus.FAILED;
    } else if (paymentIntent?.status !== StripePaymentStatus.SUCCEEDED) {
      status = null; // handle other statuses
    } else {
      status = PaymentStatus.SUCCEEDED;
    }

    return {
      id: paymentIntent.id,
      customer: paymentIntent.customer as string,
      clientSecret: paymentIntent.client_secret,
      status,
      amount: paymentIntent.amount,
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      latestCharge: paymentIntent.latest_charge as string,
    };
  }

  async getDefaultPaymentMethod(customerId: string): Promise<string | null> {
    const customer = await this.retrieveCustomer(customerId);
    return customer.defaultPaymentMethod ?? null;
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

    const defaultPaymentMethod = await this.getDefaultPaymentMethod(
      paymentMethod.customer as string,
    );

    return {
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand as string,
      last4: paymentMethod.card?.last4 as string,
      expMonth: paymentMethod.card?.exp_month as number,
      expYear: paymentMethod.card?.exp_year as number,
      default: defaultPaymentMethod === paymentMethod.id,
    };
  }

  async updateCustomer(
    customerId: string,
    data: Partial<CustomerData>,
  ): Promise<CustomerData> {
    const { email, name, address, defaultPaymentMethod } = data;
    const { line1, city, country, postalCode } = address ?? {};

    const updatePayload = defaultPaymentMethod
      ? {
          invoice_settings: {
            default_payment_method: data.defaultPaymentMethod,
          },
        }
      : {
          email,
          name,
          address: {
            line1,
            city,
            country,
            postal_code: postalCode,
          },
        };

    const customer = await this.stripe.customers.update(
      customerId,
      updatePayload,
    );

    return {
      email: customer.email!,
      name: customer.name ?? undefined,
      address: customer.address
        ? {
            line1: customer.address.line1 ?? undefined,
            city: customer.address.city ?? undefined,
            country: customer.address.country ?? undefined,
            postalCode: customer.address.postal_code ?? undefined,
          }
        : undefined,
      defaultPaymentMethod: customer.invoice_settings
        ? (customer.invoice_settings.default_payment_method as string)
        : undefined,
    };
  }

  private async retrieveCustomer(customerId: string): Promise<CustomerData> {
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
            postalCode: customer.address.postal_code ?? undefined,
          }
        : undefined,
      defaultPaymentMethod: customer.invoice_settings
        ? (customer.invoice_settings.default_payment_method as string)
        : undefined,
    };
  }

  private async listCustomerTaxIds(customerId: string): Promise<TaxId[]> {
    const taxIds = await this.stripe.customers.listTaxIds(customerId);

    return taxIds.data.map((taxId) => ({
      id: taxId.id,
      type: taxId.type as VatType,
      value: taxId.value,
    }));
  }

  private async createTaxId(
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

  private async deleteTaxId(
    customerId: string,
    taxIdId: string,
  ): Promise<void> {
    await this.stripe.customers.deleteTaxId(customerId, taxIdId);
  }

  async retrieveCardSetup(setupIntentId: string): Promise<CardSetup> {
    const setupIntent = await this.stripe.setupIntents.retrieve(setupIntentId);

    return {
      customerId: setupIntent.customer as string,
      paymentMethod: setupIntent.payment_method as string,
    };
  }

  private async retrieveCharge(
    chargeId: string,
  ): Promise<{ receipt_url: string }> {
    const charge = await this.stripe.charges.retrieve(chargeId);
    if (!charge.receipt_url) {
      throw new ServerError(ErrorPayment.NotFound);
    }
    return { receipt_url: charge.receipt_url };
  }
}
