import {
  CardSetup,
  CustomerData,
  Invoice,
  PaymentData,
  PaymentMethod,
} from '../payment.interface';
import { BillingInfoDto } from '../payment.dto';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export abstract class PaymentProvider {
  protected readonly logger: Logger = new Logger(this.constructor.name);

  /**
   * Create a new customer in the payment provider system
   * @param email Customer's email address
   * @returns Customer ID
   */
  abstract createCustomer(email: string): Promise<string>;

  /**
   * Setup payment card in the payment provider system
   * @param customerId Customer ID
   * @returns Customer ID
   */
  abstract setupCard(customerId: string): Promise<string>;

  /**
   * Create an invoice for a customer
   * @param customerId Customer ID
   * @param amountInCents Amount in cents
   * @param currency Currency code
   * @param description Invoice description
   * @returns Created invoice
   */
  abstract createInvoice(
    customerId: string,
    amountInCents: number,
    currency: string,
    description: string,
  ): Promise<Invoice>;

  /**
   * Assign a payment method and confirm the payment intent
   * @param paymentIntentId Payment intent ID
   * @param paymentMethodId Payment method ID
   * @param offSession Whether the payment is off-session
   * @returns Updated payment intent
   */
  abstract assignPaymentMethod(
    paymentIntentId: string,
    paymentMethodId: string,
    offSession: boolean,
  ): Promise<PaymentData>;

  /**
   * Get the default payment method for a customer
   * @param customerId Customer ID
   * @returns Payment method ID or null
   */
  abstract getDefaultPaymentMethod(customerId: string): Promise<string | null>;

  /**
   * List all payment methods for a customer
   * @param customerId Customer ID
   * @returns Array of payment methods
   */
  abstract listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;

  /**
   * Update customer information
   * @param customerId Customer ID
   * @param data Customer data to update
   * @returns Updated customer data
   */
  abstract updateCustomer(
    customerId: string,
    data: Partial<CustomerData>,
  ): Promise<CustomerData>;

  abstract retrieveCardSetup(setupId: string): Promise<CardSetup>;

  /**
   * Retrieve a payment method
   * @param paymentMethodId Payment method ID
   * @returns Payment method data
   */
  abstract retrievePaymentMethod(
    paymentMethodId: string,
  ): Promise<PaymentMethod>;

  /**
   * Detach a payment method from a customer
   * @param paymentMethodId Payment method ID
   * @returns Detached payment method
   */
  abstract detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod>;

  abstract getReceiptUrl(
    paymentId: string,
    customerId: string | null,
  ): Promise<string>;

  abstract retrieveBillingInfo(
    customerId: string | null,
  ): Promise<BillingInfoDto | null>;

  abstract updateBillingInfo(
    customerId: string,
    data: BillingInfoDto,
  ): Promise<any>;

  abstract retrievePaymentIntent(paymentId: string): any;
}
