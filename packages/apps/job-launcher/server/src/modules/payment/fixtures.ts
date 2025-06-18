import { faker } from '@faker-js/faker';
import {
  PaymentCurrency,
  PaymentStatus,
  StripePaymentStatus,
  VatType,
} from '../../common/enums/payment';
import {
  CardSetup,
  CustomerData,
  Invoice,
  PaymentData,
  PaymentMethod,
  TaxId,
} from './payment.interface';
import { AddressDto, BillingInfoDto } from './payment.dto';

export const createMockSetupIntent = () => ({
  id: faker.string.alphanumeric(24),
  client_secret: faker.string.alphanumeric(32),
  customer: faker.string.alphanumeric(24),
  payment_method: faker.string.alphanumeric(24),
  status: 'requires_payment_method',
  created: faker.number.int(),
});

export const createMockPaymentIntent = (overrides: Partial<any> = {}) => ({
  id: faker.string.alphanumeric(24),
  client_secret: faker.string.alphanumeric(32),
  status: StripePaymentStatus.REQUIRES_PAYMENT_METHOD,
  amount: faker.number.int({ min: 1000, max: 100000 }),
  amount_received: 0,
  currency: PaymentCurrency.USD,
  customer: faker.string.alphanumeric(24),
  latest_charge: faker.string.alphanumeric(24),
  created: faker.number.int(),
  ...overrides,
});

export const createMockCustomer = (overrides: Partial<any> = {}) => ({
  id: faker.string.alphanumeric(24),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  address: {
    line1: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.countryCode(),
    postal_code: faker.location.zipCode(),
  },
  invoice_settings: {
    default_payment_method: faker.string.alphanumeric(24),
  },
  created: faker.number.int(),
  ...overrides,
});

export const createMockPaymentMethod = (overrides: Partial<any> = {}) => ({
  id: faker.string.alphanumeric(24),
  card: {
    brand: faker.helpers.arrayElement(['visa', 'mastercard', 'amex']),
    last4: faker.string.numeric(4),
    exp_month: faker.number.int({ min: 1, max: 12 }),
    exp_year: faker.number.int({ min: 2024, max: 2030 }),
  },
  customer: faker.string.alphanumeric(24),
  created: faker.number.int(),
  ...overrides,
});

export const createMockInvoice = (overrides: Partial<any> = {}) => ({
  id: faker.string.alphanumeric(24),
  payment_intent: faker.string.alphanumeric(24),
  status: 'draft',
  amount_due: faker.number.int({ min: 1000, max: 100000 }),
  currency: PaymentCurrency.USD,
  customer: faker.string.alphanumeric(24),
  created: faker.number.int(),
  ...overrides,
});

export const createMockCharge = (overrides: Partial<any> = {}) => ({
  id: faker.string.alphanumeric(24),
  receipt_url: faker.internet.url(),
  amount: faker.number.int({ min: 1000, max: 100000 }),
  currency: PaymentCurrency.USD,
  created: faker.number.int(),
  ...overrides,
});

export const createMockTaxId = (overrides: Partial<any> = {}) => ({
  id: faker.string.alphanumeric(24),
  type: faker.helpers.arrayElement(Object.values(VatType)),
  value: faker.string.alphanumeric(10),
  created: faker.number.int(),
  ...overrides,
});

// Fixtures for our internal interfaces
export const createMockPaymentData = (
  overrides: Partial<PaymentData> = {},
): PaymentData => ({
  id: faker.string.alphanumeric(24),
  clientSecret: faker.string.alphanumeric(32),
  status: PaymentStatus.FAILED,
  amount: faker.number.int({ min: 1000, max: 100000 }),
  amountReceived: 0,
  currency: PaymentCurrency.USD,
  customer: faker.string.alphanumeric(24),
  latestCharge: faker.string.alphanumeric(24),
  ...overrides,
});

export const createMockPaymentMethodData = (
  overrides: Partial<PaymentMethod> = {},
): PaymentMethod => ({
  id: faker.string.alphanumeric(24),
  brand: faker.helpers.arrayElement(['visa', 'mastercard', 'amex']),
  last4: faker.string.numeric(4),
  expMonth: faker.number.int({ min: 1, max: 12 }),
  expYear: faker.number.int({ min: 2024, max: 2030 }),
  default: false,
  ...overrides,
});

export const createMockCardSetup = (
  overrides: Partial<CardSetup> = {},
): CardSetup => ({
  customerId: faker.string.alphanumeric(24),
  paymentMethod: faker.string.alphanumeric(24),
  ...overrides,
});

export const createMockInvoiceData = (
  overrides: Partial<Invoice> = {},
): Invoice => ({
  id: faker.string.alphanumeric(24),
  paymentId: faker.string.alphanumeric(24),
  status: 'draft',
  amountDue: faker.number.int({ min: 1000, max: 100000 }),
  currency: PaymentCurrency.USD,
  ...overrides,
});

export const createMockCustomerData = (
  overrides: Partial<CustomerData> = {},
): CustomerData => ({
  email: faker.internet.email(),
  name: faker.person.fullName(),
  address: {
    line1: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.countryCode(),
    postalCode: faker.location.zipCode(),
  },
  defaultPaymentMethod: faker.string.alphanumeric(24),
  ...overrides,
});

export const createMockTaxIdData = (overrides: Partial<TaxId> = {}): TaxId => ({
  id: faker.string.alphanumeric(24),
  type: faker.helpers.arrayElement(Object.values(VatType)),
  value: faker.string.alphanumeric(10),
  ...overrides,
});

export const createMockBillingInfoDto = (
  overrides: Partial<BillingInfoDto> = {},
): BillingInfoDto => {
  const dto = new BillingInfoDto();
  dto.name = faker.person.fullName();
  dto.email = faker.internet.email();
  dto.address = new AddressDto();
  dto.address.line = faker.location.streetAddress();
  dto.address.city = faker.location.city();
  dto.address.country = faker.location.countryCode().toLowerCase();
  dto.address.postalCode = faker.location.zipCode();
  dto.vat = faker.string.alphanumeric(10);
  dto.vatType = faker.helpers.arrayElement(Object.values(VatType));

  return Object.assign(dto, overrides);
};
