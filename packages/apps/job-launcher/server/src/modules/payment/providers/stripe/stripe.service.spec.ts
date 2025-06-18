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
    const mockSetupIntent = {
      id: 'seti_123',
      client_secret: 'seti_secret_123',
      customer: 'cus_123',
      payment_method: 'pm_123',
    };

    it('should create setup intent successfully', async () => {
      stripeMock.setupIntents.create = jest
        .fn()
        .mockResolvedValue(mockSetupIntent);

      const result = await service.setupCard('cus_123');

      expect(result).toBe('seti_secret_123');
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
    const mockPaymentIntent = {
      id: 'pi_123',
      client_secret: 'pi_secret_123',
      status: StripePaymentStatus.REQUIRES_PAYMENT_METHOD,
      amount: 1000,
      amount_received: 1000,
      currency: PaymentCurrency.USD,
      customer: 'cus_123',
      latest_charge: 'ch_123',
    } as Stripe.PaymentIntent;

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
        id: 'pi_123',
        clientSecret: 'pi_secret_123',
        status: PaymentStatus.FAILED,
        amount: 1000,
        amountReceived: 1000,
        currency: PaymentCurrency.USD,
        customer: 'cus_123',
        latestCharge: 'ch_123',
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
        id: 'pi_123',
        clientSecret: 'pi_secret_123',
        status: PaymentStatus.FAILED,
        amount: 1000,
        amountReceived: 1000,
        currency: PaymentCurrency.USD,
        customer: 'cus_123',
        latestCharge: 'ch_123',
      } as PaymentData);
    });
  });

  describe('createInvoice', () => {
    const mockInvoice = {
      id: 'inv_123',
      payment_intent: 'pi_123',
      status: 'draft',
      amount_due: 1000,
      currency: PaymentCurrency.USD,
    };

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

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_123',
        name: 'Updated Name',
        email: 'test@example.com',
        address: {
          line1: '123 Street',
          city: 'City',
          country: 'US',
          postal_code: '12345',
        },
        invoice_settings: {
          default_payment_method: 'pm_123',
        },
      };
      stripeMock.customers.update = jest.fn().mockResolvedValue(mockCustomer);

      const updateData = {
        name: 'Updated Name',
        address: {
          line1: '123 Street',
          city: 'City',
        },
      };

      const result = await service.updateCustomer('cus_123', updateData);

      expect(result).toEqual({
        email: mockCustomer.email,
        name: mockCustomer.name,
        address: {
          line1: '123 Street',
          city: 'City',
          country: 'US',
          postalCode: '12345',
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
      const mockPaymentMethod = {
        id: 'pm_123',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2024,
        },
      };

      stripeMock.paymentMethods.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentMethod);

      const result = await service.retrievePaymentMethod('pm_123');

      expect(result).toEqual({
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2024,
        default: false,
      });
      expect(stripeMock.paymentMethods.retrieve).toHaveBeenCalledWith('pm_123');
    });
  });

  describe('detachPaymentMethod', () => {
    it('should detach payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 'pm_123',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2024,
        },
      };

      stripeMock.paymentMethods.detach = jest
        .fn()
        .mockResolvedValue(mockPaymentMethod);

      const result = await service.detachPaymentMethod('pm_123');

      expect(result).toEqual({
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2024,
        default: false,
      });
      expect(stripeMock.paymentMethods.detach).toHaveBeenCalledWith('pm_123');
    });
  });

  describe('getReceiptUrl', () => {
    it('should return receipt URL for valid payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        customer: 'cus_123',
        latest_charge: 'ch_123',
      };
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
      const mockPaymentIntent = {
        id: 'pi_123',
        customer: 'cus_456',
        latest_charge: 'ch_123',
      };

      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      await expect(service.getReceiptUrl('pi_123', 'cus_123')).rejects.toThrow(
        new NotFoundError(ErrorPayment.NotFound),
      );
    });

    it('should throw NotFoundError when receipt URL is missing', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        customer: 'cus_123',
        latest_charge: 'ch_123',
      };
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
      const mockCustomer = {
        id: 'cus_123',
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line1: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
        },
      };

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
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line: '123 Main St',
          city: 'New York',
          country: 'us',
          postalCode: '10001',
        },
        vat: 'DE123456789',
        vatType: VatType.EU_VAT,
      });
    });

    it('should return partial billing info when some data is missing', async () => {
      const mockCustomer = {
        id: 'cus_123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      stripeMock.customers.retrieve = jest.fn().mockResolvedValue(mockCustomer);
      stripeMock.customers.listTaxIds = jest
        .fn()
        .mockResolvedValue({ data: [] });

      const result = await service.retrieveBillingInfo('cus_123');

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
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

      const mockUpdatedCustomer = {
        id: 'cus_123',
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line1: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001',
        },
      };

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

      const mockUpdatedCustomer = {
        id: 'cus_123',
        name: 'John Doe',
        email: 'john@example.com',
      };

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
