import { Injectable, Logger } from '@nestjs/common';
import { VatType } from '../../../common/enums/payment';
import {
  Invoice,
  PaymentIntent,
  CustomerData,
  PaymentMethod,
  TaxId,
  SetupIntent,
} from '../payment.interface';

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
   * Create a setup intent for adding a new payment method
   * @param customerId Customer ID
   * @returns Setup intent client secret
   */
  abstract createSetupIntent(customerId: string): Promise<string>;

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
   * Handle a payment intent (confirm, update, etc.)
   * @param paymentIntentId Payment intent ID
   * @param paymentMethodId Payment method ID
   * @param offSession Whether the payment is off-session
   * @returns Updated payment intent
   */
  abstract handlePaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
    offSession: boolean,
  ): Promise<PaymentIntent>;

  /**
   * Retrieve a customer's information
   * @param customerId Customer ID
   * @returns Customer data
   */
  abstract retrieveCustomer(customerId: string): Promise<CustomerData>;

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

  /**
   * List tax IDs for a customer
   * @param customerId Customer ID
   * @returns Array of tax IDs
   */
  abstract listCustomerTaxIds(customerId: string): Promise<TaxId[]>;

  /**
   * Create a tax ID for a customer
   * @param customerId Customer ID
   * @param type Tax ID type
   * @param value Tax ID value
   * @returns Created tax ID
   */
  abstract createTaxId(
    customerId: string,
    type: VatType,
    value: string,
  ): Promise<TaxId>;

  /**
   * Delete a tax ID
   * @param customerId Customer ID
   * @param taxIdId Tax ID to delete
   */
  abstract deleteTaxId(customerId: string, taxIdId: string): Promise<void>;

  abstract retrieveSetupIntent(setupId: string): Promise<SetupIntent>;

  /**
   * Retrieve a payment intent
   * @param paymentIntentId Payment intent ID
   * @returns Payment intent data
   */
  abstract retrievePaymentIntent(
    paymentIntentId: string | null,
  ): Promise<PaymentIntent>;

  /**
   * Retrieve a charge
   * @param chargeId Charge ID
   * @returns Charge data with receipt URL
   */
  abstract retrieveCharge(chargeId: string): Promise<{ receipt_url: string }>;

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
}
