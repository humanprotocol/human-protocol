import {
  CardSetup,
  CustomerData,
  Invoice,
  PaymentData,
  PaymentMethod,
} from '../payment.interface';
import { BillingInfoDto } from '../payment.dto';

export interface PaymentProvider {
  /**
   * Create a new customer in the payment provider system
   * @param customerId Customer ID
   * @param email Customer's email address
   * @returns Customer ID
   */
  createCustomerWithCard(
    customerId: string | null,
    email: string,
  ): Promise<string>;

  /**
   * Create an invoice for a customer
   * @param customerId Customer ID
   * @param amountInCents Amount in cents
   * @param currency Currency code
   * @param description Invoice description
   * @returns Created invoice
   */
  createInvoice(
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
  createPayment(
    paymentIntentId: string,
    paymentMethodId: string,
    offSession: boolean,
  ): Promise<PaymentData>;

  /**
   * Get the default payment method for a customer
   * @param customerId Customer ID
   * @returns Payment method ID or null
   */
  getDefaultPaymentMethod(customerId: string): Promise<string | null>;

  /**
   * List all payment methods for a customer
   * @param customerId Customer ID
   * @returns Array of payment methods
   */
  listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;

  /**
   * Update customer information
   * @param customerId Customer ID
   * @param data Customer data to update
   * @returns Updated customer data
   */
  updateCustomer(
    customerId: string,
    data: Partial<CustomerData>,
  ): Promise<CustomerData>;

  retrieveCardSetup(setupId: string): Promise<CardSetup>;

  /**
   * Retrieve a payment method
   * @param paymentMethodId Payment method ID
   * @returns Payment method data
   */
  retrievePaymentMethod(paymentMethodId: string): Promise<PaymentMethod>;

  /**
   * Detach a payment method from a customer
   * @param paymentMethodId Payment method ID
   * @returns Detached payment method
   */
  detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod>;

  getReceiptUrl(paymentId: string, customerId: string | null): Promise<string>;

  retrieveBillingInfo(
    customerId: string | null,
  ): Promise<BillingInfoDto | null>;

  updateBillingInfo(customerId: string, data: BillingInfoDto): Promise<any>;

  retrievePaymentIntent(paymentId: string): any;
}
