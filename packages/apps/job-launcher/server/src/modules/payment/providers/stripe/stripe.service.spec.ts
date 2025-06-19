jest.mock('stripe');

import { faker } from '@faker-js/faker';
import { PaymentData } from '../../payment.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeConfigService } from '../../../../common/config/stripe-config.service';
import Stripe from 'stripe';
import { NotFoundError, ServerError } from '../../../../common/errors';
import { ErrorPayment } from '../../../../common/constants/errors';
import {
  PaymentCurrency,
  PaymentStatus,
  StripePaymentStatus,
  VatType,
} from '../../../../common/enums/payment';
import {
  createMockBillingInfoDto,
  createMockCharge,
  createMockCustomer,
  createMockInvoice,
  createMockPaymentIntent,
  createMockPaymentMethod,
  createMockSetupIntent,
  createMockTaxId,
} from './fixtures';

describe('StripeService', () => {
  let service: StripeService;
  let stripeMock: jest.Mocked<Stripe>;
  let loggerSpy: jest.SpyInstance;

  const mockStripeConfigService = {
    secretKey: 'test_key',
    apiVersion: '2023-10-16',
    appName: 'test-app',
    appVersion: '1.0.0',
    appInfoURL: 'https://test.com',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: StripeConfigService,
          useValue: mockStripeConfigService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);

    // Create a properly structured mock for Stripe
    stripeMock = {
      customers: {
        create: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn(),
        listPaymentMethods: jest.fn(),
        listTaxIds: jest.fn(),
        deleteTaxId: jest.fn(),
        createTaxId: jest.fn(),
      },
      setupIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
      paymentIntents: {
        confirm: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn(),
      },
      invoices: {
        create: jest.fn(),
        finalizeInvoice: jest.fn(),
      },
      invoiceItems: {
        create: jest.fn(),
      },
      paymentMethods: {
        detach: jest.fn(),
        retrieve: jest.fn(),
      },
      charges: {
        retrieve: jest.fn(),
      },
    } as unknown as jest.Mocked<Stripe>;

    (service as any).stripe = stripeMock;
    loggerSpy = jest.spyOn(Logger.prototype, 'log');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomer = { id: faker.string.uuid() };
      stripeMock.customers.create = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const email = faker.internet.email();
      const result = await service.createCustomer(email);

      expect(result).toBe(mockCustomer.id);
      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email,
      });
    });

    it('should handle errors when creating customer', async () => {
      stripeMock.customers.create = jest
        .fn()
        .mockRejectedValue(new Error('Stripe error'));

      const email = faker.internet.email();

      await expect(service.createCustomer(email)).rejects.toThrow(
        new ServerError(ErrorPayment.CustomerNotCreated),
      );
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('setupCard', () => {
    const mockSetupIntent = createMockSetupIntent();

    it('should create setup intent successfully', async () => {
      stripeMock.setupIntents.create = jest
        .fn()
        .mockResolvedValueOnce(mockSetupIntent);

      const customerId = faker.string.uuid();
      const result = await service.setupCard(customerId);

      expect(result).toBe(mockSetupIntent.client_secret);
      expect(stripeMock.setupIntents.create).toHaveBeenCalledWith({
        automatic_payment_methods: { enabled: true },
        customer: customerId,
      });
    });

    it('should handle null customerId', async () => {
      stripeMock.setupIntents.create = jest
        .fn()
        .mockResolvedValueOnce(mockSetupIntent);

      await service.setupCard(null);

      expect(stripeMock.setupIntents.create).toHaveBeenCalledWith({
        automatic_payment_methods: { enabled: true },
        customer: undefined,
      });
    });

    it('should handle missing client secret', async () => {
      stripeMock.setupIntents.create = jest.fn().mockResolvedValueOnce({});

      const customerId = faker.string.uuid();

      await expect(service.setupCard(customerId)).rejects.toThrow(
        new ServerError(ErrorPayment.ClientSecretDoesNotExist),
      );
    });
  });

  describe('assignPaymentMethod', () => {
    const mockPaymentIntent = createMockPaymentIntent();

    it('should assign off-session payment method', async () => {
      stripeMock.paymentIntents.confirm = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);

      const paymentIntentId = faker.string.uuid();
      const paymentMethodId = faker.string.uuid();

      const result = await service.assignPaymentMethod(
        paymentIntentId,
        paymentMethodId,
        true,
      );

      expect(stripeMock.paymentIntents.confirm).toHaveBeenCalledWith(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
          off_session: true,
        },
      );
      expect(result).toEqual({
        id: mockPaymentIntent.id,
        clientSecret: mockPaymentIntent.client_secret,
        status: PaymentStatus.FAILED,
        amount: mockPaymentIntent.amount,
        amountReceived: mockPaymentIntent.amount_received,
        currency: mockPaymentIntent.currency,
        customer: mockPaymentIntent.customer,
        latestCharge: mockPaymentIntent.latest_charge,
      } as PaymentData);
    });

    it('should assign on-session payment method', async () => {
      stripeMock.paymentIntents.update = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);

      const paymentIntentId = faker.string.uuid();
      const paymentMethodId = faker.string.uuid();

      const result = await service.assignPaymentMethod(
        paymentIntentId,
        paymentMethodId,
        false,
      );

      expect(stripeMock.paymentIntents.update).toHaveBeenCalledWith(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );
      expect(result).toEqual({
        id: mockPaymentIntent.id,
        clientSecret: mockPaymentIntent.client_secret,
        status: PaymentStatus.FAILED,
        amount: mockPaymentIntent.amount,
        amountReceived: mockPaymentIntent.amount_received,
        currency: mockPaymentIntent.currency,
        customer: mockPaymentIntent.customer,
        latestCharge: mockPaymentIntent.latest_charge,
      } as PaymentData);
    });
  });

  describe('createInvoice', () => {
    const mockInvoice = createMockInvoice();

    it('should create invoice successfully', async () => {
      const customerId = faker.string.uuid();

      stripeMock.invoices.create = jest
        .fn()
        .mockResolvedValueOnce({ id: customerId });
      stripeMock.invoiceItems.create = jest.fn().mockResolvedValueOnce({});
      stripeMock.invoices.finalizeInvoice = jest
        .fn()
        .mockResolvedValueOnce(mockInvoice);

      const result = await service.createInvoice(
        customerId,
        1000,
        PaymentCurrency.USD,
        'Test invoice',
      );

      expect(stripeMock.invoices.create).toHaveBeenCalled();
      expect(stripeMock.invoiceItems.create).toHaveBeenCalled();
      expect(stripeMock.invoices.finalizeInvoice).toHaveBeenCalled();

      const { id, payment_intent, status, currency, amount_due } = mockInvoice;

      expect(result).toEqual({
        id,
        paymentId: payment_intent,
        status,
        currency,
        amountDue: amount_due,
      });
    });

    it('should throw error when payment intent is missing', async () => {
      const customerId = faker.string.uuid();
      const invoiceId = faker.string.uuid();

      stripeMock.invoices.create = jest
        .fn()
        .mockResolvedValueOnce({ id: invoiceId });
      stripeMock.invoiceItems.create = jest.fn().mockResolvedValueOnce({});
      stripeMock.invoices.finalizeInvoice = jest
        .fn()
        .mockResolvedValueOnce({ id: invoiceId });

      await expect(
        service.createInvoice(
          customerId,
          1000,
          PaymentCurrency.USD,
          'Test invoice',
        ),
      ).rejects.toThrow(new ServerError(ErrorPayment.IntentNotCreated));
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const mockPaymentIntent = createMockPaymentIntent({
        status: StripePaymentStatus.SUCCEEDED,
        amount_received: 1000,
      });

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);

      const result = await service.retrievePaymentIntent(mockPaymentIntent.id);

      expect(result).toEqual({
        id: mockPaymentIntent.id,
        clientSecret: mockPaymentIntent.client_secret,
        status: PaymentStatus.SUCCEEDED,
        amount: mockPaymentIntent.amount,
        amountReceived: mockPaymentIntent.amount_received,
        currency: mockPaymentIntent.currency,
        customer: mockPaymentIntent.customer,
        latestCharge: mockPaymentIntent.latest_charge,
      } as PaymentData);
      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith(
        mockPaymentIntent.id,
      );
    });

    it('should handle different payment statuses', async () => {
      const statuses = [
        {
          stripe: StripePaymentStatus.REQUIRES_PAYMENT_METHOD,
          expected: PaymentStatus.FAILED,
        },
        {
          stripe: StripePaymentStatus.SUCCEEDED,
          expected: PaymentStatus.SUCCEEDED,
        },
        {
          stripe: StripePaymentStatus.CANCELED,
          expected: PaymentStatus.FAILED,
        },
      ];

      for (const { stripe, expected } of statuses) {
        const mockPaymentIntent = createMockPaymentIntent({ status: stripe });
        stripeMock.paymentIntents.retrieve = jest
          .fn()
          .mockResolvedValueOnce(mockPaymentIntent);

        const result = await service.retrievePaymentIntent(
          mockPaymentIntent.id,
        );

        expect(result.status).toBe(expected);
      }
    });

    it('should handle missing client secret', async () => {
      const mockPaymentIntent = createMockPaymentIntent({
        client_secret: null,
      });
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);

      const result = await service.retrievePaymentIntent(mockPaymentIntent.id);

      expect(result.clientSecret).toBeNull();
    });
  });

  describe('getDefaultPaymentMethod', () => {
    it('should return default payment method ID when available', async () => {
      const mockCustomer = createMockCustomer();
      const defaultPaymentMethod = faker.string.alphanumeric();

      (mockCustomer as any).invoice_settings = {
        default_payment_method: defaultPaymentMethod,
      };

      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const result = await service.getDefaultPaymentMethod(mockCustomer.id);

      expect(result).toBe(defaultPaymentMethod);
      expect(stripeMock.customers.retrieve).toHaveBeenCalledWith(
        mockCustomer.id,
      );
    });

    it('should return null when no default payment method', async () => {
      const mockCustomer = createMockCustomer();
      (mockCustomer as any).invoice_settings = {
        default_payment_method: null,
      };

      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const result = await service.getDefaultPaymentMethod(mockCustomer.id);

      expect(result).toBeNull();
    });

    it('should return null when customer has no invoice settings', async () => {
      const mockCustomer = createMockCustomer();
      (mockCustomer as any).invoice_settings = undefined;

      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const result = await service.getDefaultPaymentMethod(mockCustomer.id);

      expect(result).toBeNull();
    });
  });

  describe('listPaymentMethods', () => {
    it('should return list of payment methods', async () => {
      const mockCustomer = createMockCustomer();

      const mockPaymentMethods = [
        createMockPaymentMethod(),
        createMockPaymentMethod(),
      ];

      mockPaymentMethods[0].id = 'pm_1';
      mockPaymentMethods[0].card = {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2024,
      };
      mockPaymentMethods[1].id = 'pm_2';
      mockPaymentMethods[1].card = {
        brand: 'mastercard',
        last4: '5555',
        exp_month: 6,
        exp_year: 2025,
      };

      stripeMock.customers.listPaymentMethods = jest
        .fn()
        .mockResolvedValueOnce({ data: mockPaymentMethods });
      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const result = await service.listPaymentMethods(mockCustomer.id);

      expect(result).toEqual([
        {
          id: 'pm_1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2024,
          default: false,
        },
        {
          id: 'pm_2',
          brand: 'mastercard',
          last4: '5555',
          expMonth: 6,
          expYear: 2025,
          default: false,
        },
      ]);
      expect(stripeMock.customers.listPaymentMethods).toHaveBeenCalledWith(
        mockCustomer.id,
        { type: 'card', limit: 100 },
      );
    });

    it('should return empty array when no payment methods', async () => {
      const mockCustomer = createMockCustomer();

      stripeMock.customers.listPaymentMethods = jest
        .fn()
        .mockResolvedValueOnce({ data: [] });

      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const result = await service.listPaymentMethods(mockCustomer.id);

      expect(result).toEqual([]);
    });

    it('should handle payment methods without card details', async () => {
      const mockCustomer = createMockCustomer();

      const mockPaymentMethods = [createMockPaymentMethod()];
      (mockPaymentMethods[0] as any).card = null;

      stripeMock.customers.listPaymentMethods = jest
        .fn()
        .mockResolvedValueOnce({ data: mockPaymentMethods });
      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const result = await service.listPaymentMethods(mockCustomer.id);

      expect(result[0]).toEqual({
        id: mockPaymentMethods[0].id,
        brand: undefined,
        last4: undefined,
        expMonth: undefined,
        expYear: undefined,
        default: false,
      });
    });
  });

  describe('retrieveCardSetup', () => {
    it('should retrieve card setup successfully', async () => {
      const mockSetupIntent = createMockSetupIntent();

      stripeMock.setupIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockSetupIntent);

      const result = await service.retrieveCardSetup(mockSetupIntent.id);

      expect(result).toEqual({
        customerId: mockSetupIntent.customer,
        paymentMethod: mockSetupIntent.payment_method,
      });
      expect(stripeMock.setupIntents.retrieve).toHaveBeenCalledWith(
        mockSetupIntent.id,
      );
    });

    it('should handle setup intent without customer', async () => {
      const mockSetupIntent = createMockSetupIntent();
      (mockSetupIntent as any).customer = null;

      stripeMock.setupIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockSetupIntent);

      const result = await service.retrieveCardSetup(mockSetupIntent.id);

      expect(result).toEqual({
        customerId: null,
        paymentMethod: mockSetupIntent.payment_method,
      });
    });

    it('should handle setup intent without payment method', async () => {
      const mockSetupIntent = createMockSetupIntent();
      (mockSetupIntent as any).payment_method = null;

      stripeMock.setupIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockSetupIntent);

      const result = await service.retrieveCardSetup(mockSetupIntent.id);

      expect(result).toEqual({
        customerId: mockSetupIntent.customer,
        paymentMethod: null,
      });
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const mockCustomer = createMockCustomer();
      stripeMock.customers.update = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);

      const updateData = {
        name: 'Updated Name',
        address: {
          line1: '123 Street',
          city: 'City',
        },
      };

      const result = await service.updateCustomer(mockCustomer.id, updateData);

      const { line1, city, country, postal_code } = mockCustomer.address;

      expect(result).toEqual({
        email: mockCustomer.email,
        name: mockCustomer.name,
        address: {
          line1,
          city,
          country,
          postalCode: postal_code,
        },
        defaultPaymentMethod:
          mockCustomer.invoice_settings.default_payment_method,
      });

      expect(stripeMock.customers.update).toHaveBeenCalledWith(
        mockCustomer.id,
        updateData,
      );
    });
  });

  describe('retrievePaymentMethod', () => {
    it('should retrieve payment method successfully', async () => {
      const mockCustomer = createMockCustomer();
      const mockPaymentMethod = createMockPaymentMethod();

      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);
      stripeMock.paymentMethods.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentMethod);

      const result = await service.retrievePaymentMethod(mockPaymentMethod.id);

      expect(result).toEqual({
        id: mockPaymentMethod.id,
        brand: mockPaymentMethod.card.brand,
        last4: mockPaymentMethod.card.last4,
        expMonth: mockPaymentMethod.card.exp_month,
        expYear: mockPaymentMethod.card.exp_year,
        default: false,
      });
      expect(stripeMock.paymentMethods.retrieve).toHaveBeenCalledWith(
        mockPaymentMethod.id,
      );
    });
  });

  describe('detachPaymentMethod', () => {
    it('should detach payment method successfully', async () => {
      const mockPaymentMethod = createMockPaymentMethod();

      stripeMock.paymentMethods.detach = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentMethod);

      const result = await service.detachPaymentMethod(mockPaymentMethod.id);

      expect(result).toEqual({
        id: mockPaymentMethod.id,
        brand: mockPaymentMethod.card.brand,
        last4: mockPaymentMethod.card.last4,
        expMonth: mockPaymentMethod.card.exp_month,
        expYear: mockPaymentMethod.card.exp_year,
        default: false,
      });
      expect(stripeMock.paymentMethods.detach).toHaveBeenCalledWith(
        mockPaymentMethod.id,
      );
    });
  });

  describe('getReceiptUrl', () => {
    it('should return receipt URL for valid payment', async () => {
      const customerId = faker.string.uuid();

      const mockPaymentIntent = createMockPaymentIntent({
        customer: customerId,
        latest_charge: 'ch_123',
      });
      const mockCharge = {
        receipt_url: faker.internet.email(),
      };

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);
      stripeMock.charges.retrieve = jest.fn().mockResolvedValueOnce(mockCharge);

      const result = await service.getReceiptUrl(
        mockPaymentIntent.id,
        customerId,
      );

      expect(result).toBe(mockCharge.receipt_url);
      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith(
        mockPaymentIntent.id,
      );
      expect(stripeMock.charges.retrieve).toHaveBeenCalledWith(
        mockPaymentIntent.latest_charge,
      );
    });

    it('should throw NotFoundError when payment intent not found', async () => {
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(null);

      await expect(
        service.getReceiptUrl(faker.string.uuid(), faker.string.uuid()),
      ).rejects.toThrow(new NotFoundError(ErrorPayment.NotFound));
    });

    it('should throw NotFoundError when customer ID does not match', async () => {
      const customerId = faker.string.uuid();

      const mockPaymentIntent = createMockPaymentIntent({
        latest_charge: faker.string.uuid(),
      });

      const mockCharge = {
        receipt_url: null,
      };

      stripeMock.charges.retrieve = jest.fn().mockResolvedValueOnce(mockCharge);

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);

      await expect(
        service.getReceiptUrl(mockPaymentIntent.id, customerId),
      ).rejects.toThrow(new NotFoundError(ErrorPayment.NotFound));
    });

    it('should throw NotFoundError when receipt URL is missing', async () => {
      const customerId = faker.string.uuid();

      const mockPaymentIntent = createMockPaymentIntent({
        customer: customerId,
        latest_charge: faker.string.uuid(),
      });
      const mockCharge = createMockCharge({
        receipt_url: null,
      });

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockPaymentIntent);
      stripeMock.charges.retrieve = jest.fn().mockResolvedValueOnce(mockCharge);

      await expect(
        service.getReceiptUrl(mockPaymentIntent.id, customerId),
      ).rejects.toThrow(new NotFoundError(ErrorPayment.NotFound));
    });
  });

  describe('retrieveBillingInfo', () => {
    it('should return null when customerId is null', async () => {
      const result = await service.retrieveBillingInfo(null);
      expect(result).toBeNull();
    });

    it('should return complete billing info when all data is available', async () => {
      const mockCustomer = createMockCustomer();
      const mockTaxIds = [
        {
          id: 'txi_123',
          type: VatType.EU_VAT,
          value: 'DE123456789',
        },
      ];

      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);
      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValueOnce({ data: mockTaxIds });

      const result = await service.retrieveBillingInfo(mockCustomer.id);

      expect(result).toEqual({
        name: mockCustomer.name,
        email: mockCustomer.email,
        address: {
          line: mockCustomer.address.line1,
          city: mockCustomer.address.city,
          country: mockCustomer.address.country.toLowerCase(),
          postalCode: mockCustomer.address.postal_code,
        },
        vat: 'DE123456789',
        vatType: VatType.EU_VAT,
      });
    });

    it('should return partial billing info when some data is missing', async () => {
      const mockCustomer = createMockCustomer({
        address: undefined,
      });

      stripeMock.customers.retrieve = jest
        .fn()
        .mockResolvedValueOnce(mockCustomer);
      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValueOnce({ data: [] });

      const result = await service.retrieveBillingInfo(mockCustomer.id);

      expect(result).toEqual({
        name: mockCustomer.name,
        email: mockCustomer.email,
        address: undefined,
        vat: undefined,
        vatType: undefined,
      });
    });
  });

  describe('updateBillingInfo', () => {
    it('should update all billing information', async () => {
      const mockTaxId = createMockTaxId();

      const mockExistingTaxIds = [mockTaxId];

      const mockUpdatedCustomer = createMockCustomer();

      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValueOnce({ data: mockExistingTaxIds });
      stripeMock.customers.deleteTaxId = jest.fn().mockResolvedValueOnce({});
      stripeMock.customers.createTaxId = jest
        .fn()
        .mockResolvedValueOnce(mockTaxId);
      stripeMock.customers.update = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedCustomer);

      const mockUpdateBillingInfo = createMockBillingInfoDto();
      const { name, email, address } = mockUpdateBillingInfo;
      const { city, country, postalCode, line } = address ?? {};

      await service.updateBillingInfo(
        mockUpdatedCustomer.id,
        mockUpdateBillingInfo,
      );

      expect(stripeMock.customers.deleteTaxId).toHaveBeenCalledWith(
        mockUpdatedCustomer.id,
        mockExistingTaxIds[0].id,
      );
      expect(stripeMock.customers.createTaxId).toHaveBeenCalledWith(
        mockUpdatedCustomer.id,
        {
          type: mockUpdateBillingInfo.vatType,
          value: mockUpdateBillingInfo.vat,
        },
      );
      expect(stripeMock.customers.update).toHaveBeenCalledWith(
        mockUpdatedCustomer.id,
        {
          name,
          email,
          address: {
            city,
            country,
            line1: line,
            postal_code: postalCode,
          },
        },
      );
    });

    it('should handle update without VAT information', async () => {
      const mockTaxId = createMockTaxId();

      const mockExistingTaxIds = [mockTaxId];

      const mockUpdatedCustomer = createMockCustomer();

      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValueOnce({ data: mockExistingTaxIds });
      stripeMock.customers.deleteTaxId = jest.fn().mockResolvedValueOnce({});
      stripeMock.customers.update = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedCustomer);

      const mockUpdateBillingInfo = createMockBillingInfoDto({
        vat: undefined,
        vatType: undefined,
      });

      const { name, email, address } = mockUpdateBillingInfo;
      const { city, country, postalCode, line } = address ?? {};

      await service.updateBillingInfo(
        mockUpdatedCustomer.id,
        mockUpdateBillingInfo,
      );

      expect(stripeMock.customers.deleteTaxId).toHaveBeenCalledWith(
        mockUpdatedCustomer.id,
        mockTaxId.id,
      );
      expect(stripeMock.customers.createTaxId).not.toHaveBeenCalled();
      expect(stripeMock.customers.update).toHaveBeenCalledWith(
        mockUpdatedCustomer.id,
        {
          name,
          email,
          address: {
            city,
            country,
            line1: line,
            postal_code: postalCode,
          },
        },
      );
    });
  });
});
