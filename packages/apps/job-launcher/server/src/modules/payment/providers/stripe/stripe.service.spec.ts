jest.mock('stripe');

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
  createMockPaymentIntent,
  createMockCustomer,
  createMockPaymentMethod,
  createMockSetupIntent,
  createMockInvoice,
} from '../../fixtures';

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

  beforeEach(async () => {
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
      const mockCustomer = { id: 'cus_123' };
      stripeMock.customers.create = jest.fn().mockResolvedValue(mockCustomer);

      const result = await service.createCustomer('test@example.com');

      expect(result).toBe('cus_123');
      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should handle errors when creating customer', async () => {
      stripeMock.customers.create = jest
        .fn()
        .mockRejectedValue(new Error('Stripe error'));

      await expect(service.createCustomer('test@example.com')).rejects.toThrow(
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
        .mockResolvedValue(mockSetupIntent);

      const result = await service.setupCard('cus_123');

      expect(result).toBe(mockSetupIntent.client_secret);
      expect(stripeMock.setupIntents.create).toHaveBeenCalledWith({
        automatic_payment_methods: { enabled: true },
        customer: 'cus_123',
      });
    });

    it('should handle null customerId', async () => {
      stripeMock.setupIntents.create = jest
        .fn()
        .mockResolvedValue(mockSetupIntent);

      await service.setupCard(null);

      expect(stripeMock.setupIntents.create).toHaveBeenCalledWith({
        automatic_payment_methods: { enabled: true },
        customer: undefined,
      });
    });

    it('should handle missing client secret', async () => {
      stripeMock.setupIntents.create = jest.fn().mockResolvedValue({});

      await expect(service.setupCard('cus_123')).rejects.toThrow(
        new ServerError(ErrorPayment.ClientSecretDoesNotExist),
      );
    });
  });

  describe('assignPaymentMethod', () => {
    const mockPaymentIntent = createMockPaymentIntent();

    it('should assign off-session payment method', async () => {
      stripeMock.paymentIntents.confirm = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      const result = await service.assignPaymentMethod(
        'pi_123',
        'pm_123',
        true,
      );

      expect(stripeMock.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
        off_session: true,
      });
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
        .mockResolvedValue(mockPaymentIntent);
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      const result = await service.assignPaymentMethod(
        'pi_123',
        'pm_123',
        false,
      );

      expect(stripeMock.paymentIntents.update).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
      });
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
      stripeMock.invoices.create = jest
        .fn()
        .mockResolvedValue({ id: 'inv_123' });
      stripeMock.invoiceItems.create = jest.fn().mockResolvedValue({});
      stripeMock.invoices.finalizeInvoice = jest
        .fn()
        .mockResolvedValue(mockInvoice);

      const result = await service.createInvoice(
        'cus_123',
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
      stripeMock.invoices.create = jest
        .fn()
        .mockResolvedValue({ id: 'inv_123' });
      stripeMock.invoiceItems.create = jest.fn().mockResolvedValue({});
      stripeMock.invoices.finalizeInvoice = jest
        .fn()
        .mockResolvedValue({ id: 'inv_123' });

      await expect(
        service.createInvoice(
          'cus_123',
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
        .mockResolvedValue(mockPaymentIntent);

      const result = await service.retrievePaymentIntent('pi_123');

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
      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
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
          .mockResolvedValue(mockPaymentIntent);

        const result = await service.retrievePaymentIntent('pi_123');

        expect(result.status).toBe(expected);
      }
    });

    it('should handle missing client secret', async () => {
      const mockPaymentIntent = createMockPaymentIntent({
        client_secret: null,
      });
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      const result = await service.retrievePaymentIntent('pi_123');

      expect(result.clientSecret).toBeNull();
    });
  });

  describe('getDefaultPaymentMethod', () => {
    it('should return default payment method ID when available', async () => {
      const mockCustomer = createMockCustomer();
      (mockCustomer as any).invoice_settings = {
        default_payment_method: 'pm_default_123',
      };

      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);

      const result = await service.getDefaultPaymentMethod('cus_123');

      expect(result).toBe('pm_default_123');
      expect(stripeMock.customers.retrieve).toHaveBeenCalledWith('cus_123');
    });

    it('should return null when no default payment method', async () => {
      const mockCustomer = createMockCustomer();
      (mockCustomer as any).invoice_settings = {
        default_payment_method: null,
      };

      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);

      const result = await service.getDefaultPaymentMethod('cus_123');

      expect(result).toBeNull();
    });

    it('should return null when customer has no invoice settings', async () => {
      const mockCustomer = createMockCustomer();
      (mockCustomer as any).invoice_settings = undefined;

      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);

      const result = await service.getDefaultPaymentMethod('cus_123');

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
        .mockResolvedValue({ data: mockPaymentMethods });
      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);

      const result = await service.listPaymentMethods('cus_123');

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
        'cus_123',
        { type: 'card', limit: 100 },
      );
    });

    it('should return empty array when no payment methods', async () => {
      const mockCustomer = createMockCustomer();

      stripeMock.customers.listPaymentMethods = jest
        .fn()
        .mockResolvedValue({ data: [] });

      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);

      const result = await service.listPaymentMethods('cus_123');

      expect(result).toEqual([]);
    });

    it('should handle payment methods without card details', async () => {
      const mockCustomer = createMockCustomer();

      const mockPaymentMethods = [createMockPaymentMethod()];
      (mockPaymentMethods[0] as any).card = null;

      stripeMock.customers.listPaymentMethods = jest
        .fn()
        .mockResolvedValue({ data: mockPaymentMethods });
      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);

      const result = await service.listPaymentMethods('cus_123');

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
        .mockResolvedValue(mockSetupIntent);

      const result = await service.retrieveCardSetup('seti_123');

      expect(result).toEqual({
        customerId: mockSetupIntent.customer,
        paymentMethod: mockSetupIntent.payment_method,
      });
      expect(stripeMock.setupIntents.retrieve).toHaveBeenCalledWith('seti_123');
    });

    it('should handle setup intent without customer', async () => {
      const mockSetupIntent = createMockSetupIntent();
      (mockSetupIntent as any).customer = null;

      stripeMock.setupIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockSetupIntent);

      const result = await service.retrieveCardSetup('seti_123');

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
        .mockResolvedValue(mockSetupIntent);

      const result = await service.retrieveCardSetup('seti_123');

      expect(result).toEqual({
        customerId: mockSetupIntent.customer,
        paymentMethod: null,
      });
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const mockCustomer = createMockCustomer();
      stripeMock.customers.update = jest.fn().mockResolvedValue(mockCustomer);

      const updateData = {
        name: 'Updated Name',
        address: {
          line1: '123 Street',
          city: 'City',
        },
      };

      const result = await service.updateCustomer('cus_123', updateData);

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
        'cus_123',
        updateData,
      );
    });
  });

  describe('retrievePaymentMethod', () => {
    it('should retrieve payment method successfully', async () => {
      const mockPaymentMethod = createMockPaymentMethod();

      stripeMock.paymentMethods.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentMethod);

      const result = await service.retrievePaymentMethod('pm_123');

      expect(result).toEqual({
        id: mockPaymentMethod.id,
        brand: mockPaymentMethod.card.brand,
        last4: mockPaymentMethod.card.last4,
        expMonth: mockPaymentMethod.card.exp_month,
        expYear: mockPaymentMethod.card.exp_year,
        default: false,
      });
      expect(stripeMock.paymentMethods.retrieve).toHaveBeenCalledWith('pm_123');
    });
  });

  describe('detachPaymentMethod', () => {
    it('should detach payment method successfully', async () => {
      const mockPaymentMethod = createMockPaymentMethod();

      stripeMock.paymentMethods.detach = jest
        .fn()
        .mockResolvedValue(mockPaymentMethod);

      const result = await service.detachPaymentMethod('pm_123');

      expect(result).toEqual({
        id: mockPaymentMethod.id,
        brand: mockPaymentMethod.card.brand,
        last4: mockPaymentMethod.card.last4,
        expMonth: mockPaymentMethod.card.exp_month,
        expYear: mockPaymentMethod.card.exp_year,
        default: false,
      });
      expect(stripeMock.paymentMethods.detach).toHaveBeenCalledWith('pm_123');
    });
  });

  describe('getReceiptUrl', () => {
    it('should return receipt URL for valid payment', async () => {
      const mockPaymentIntent = createMockPaymentIntent({
        customer: 'cus_123',
        latest_charge: 'ch_123',
      });
      const mockCharge = {
        receipt_url: 'https://receipt.example.com',
      };

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);
      stripeMock.charges.retrieve = jest.fn().mockResolvedValue(mockCharge);

      const result = await service.getReceiptUrl('pi_123', 'cus_123');

      expect(result).toBe('https://receipt.example.com');
      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
      expect(stripeMock.charges.retrieve).toHaveBeenCalledWith('ch_123');
    });

    it('should throw NotFoundError when payment intent not found', async () => {
      stripeMock.paymentIntents.retrieve = jest.fn().mockResolvedValue(null);

      await expect(service.getReceiptUrl('pi_123', 'cus_123')).rejects.toThrow(
        new NotFoundError(ErrorPayment.NotFound),
      );
    });

    it('should throw NotFoundError when customer ID does not match', async () => {
      const mockPaymentIntent = createMockPaymentIntent({
        customer: 'cus_456',
        latest_charge: 'ch_123',
      });

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      await expect(service.getReceiptUrl('pi_123', 'cus_123')).rejects.toThrow(
        new NotFoundError(ErrorPayment.NotFound),
      );
    });

    it('should throw NotFoundError when receipt URL is missing', async () => {
      const mockPaymentIntent = createMockPaymentIntent({
        customer: 'cus_123',
        latest_charge: 'ch_123',
      });
      const mockCharge = {
        receipt_url: null,
      };

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);
      stripeMock.charges.retrieve = jest.fn().mockResolvedValue(mockCharge);

      await expect(service.getReceiptUrl('pi_123', 'cus_123')).rejects.toThrow(
        new NotFoundError(ErrorPayment.NotFound),
      );
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

      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);
      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValue({ data: mockTaxIds });

      const result = await service.retrieveBillingInfo('cus_123');

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

      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);
      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValue({ data: [] });

      const result = await service.retrieveBillingInfo('cus_123');

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
      const mockExistingTaxIds = [
        {
          id: 'txi_123',
          type: VatType.EU_VAT,
          value: 'DE123456789',
        },
      ];

      const mockUpdatedCustomer = createMockCustomer();

      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValue({ data: mockExistingTaxIds });
      stripeMock.customers.deleteTaxId = jest.fn().mockResolvedValue({});
      stripeMock.customers.createTaxId = jest.fn().mockResolvedValue({
        id: 'txi_456',
        type: VatType.EU_VAT,
        value: 'DE987654321',
      });
      stripeMock.customers.update = jest
        .fn()
        .mockResolvedValue(mockUpdatedCustomer);

      const updateData = {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line: '123 Main St',
          city: 'New York',
          country: 'us',
          postalCode: '10001',
        },
        vat: 'DE987654321',
        vatType: VatType.EU_VAT,
      };

      await service.updateBillingInfo('cus_123', updateData);

      expect(stripeMock.customers.deleteTaxId).toHaveBeenCalledWith(
        'cus_123',
        'txi_123',
      );
      expect(stripeMock.customers.createTaxId).toHaveBeenCalledWith('cus_123', {
        type: VatType.EU_VAT,
        value: 'DE987654321',
      });
      expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_123', {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line1: '123 Main St',
          city: 'New York',
          country: 'us',
          postal_code: '10001',
        },
      });
    });

    it('should handle update without VAT information', async () => {
      const mockExistingTaxIds = [
        {
          id: 'txi_123',
          type: VatType.EU_VAT,
          value: 'DE123456789',
        },
      ];

      const mockUpdatedCustomer = createMockCustomer();

      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValue({ data: mockExistingTaxIds });
      stripeMock.customers.deleteTaxId = jest.fn().mockResolvedValue({});
      stripeMock.customers.update = jest
        .fn()
        .mockResolvedValue(mockUpdatedCustomer);

      const updateData = {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line: '123 Main St',
          city: 'New York',
          country: 'us',
          postalCode: '10001',
        },
      };

      await service.updateBillingInfo('cus_123', updateData);

      expect(stripeMock.customers.deleteTaxId).toHaveBeenCalledWith(
        'cus_123',
        'txi_123',
      );
      expect(stripeMock.customers.createTaxId).not.toHaveBeenCalled();
      expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_123', {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line1: '123 Main St',
          city: 'New York',
          country: 'us',
          postal_code: '10001',
        },
      });
    });
  });
});
