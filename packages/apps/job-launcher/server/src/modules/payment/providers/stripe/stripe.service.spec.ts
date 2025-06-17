import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeConfigService } from '../../../../common/config/stripe-config.service';
import Stripe from 'stripe';
import { ServerError } from '../../../../common/errors';
import { ErrorPayment } from '../../../../common/constants/errors';
import {
  PaymentCurrency,
  PaymentStatus,
  VatType,
} from '../../../../common/enums/payment';
import { PaymentProvider } from '../payment-provider.abstract';

jest.mock('stripe');

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

  it('should implement PaymentProvider interface', () => {
    expect(service).toBeInstanceOf(PaymentProvider);
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

  describe('createSetupIntent', () => {
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

      const result = await service.createSetupIntent('cus_123');

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

      await service.createSetupIntent(null);

      expect(stripeMock.setupIntents.create).toHaveBeenCalledWith({
        automatic_payment_methods: { enabled: true },
        customer: undefined,
      });
    });

    it('should handle missing client secret', async () => {
      stripeMock.setupIntents.create = jest.fn().mockResolvedValue({});

      await expect(service.createSetupIntent('cus_123')).rejects.toThrow(
        new ServerError(ErrorPayment.ClientSecretDoesNotExist),
      );
    });
  });

  describe('handlePaymentIntent', () => {
    const mockPaymentIntent = {
      id: 'pi_123',
      client_secret: 'pi_secret_123',
      status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
      amount: 1000,
      currency: PaymentCurrency.USD,
      customer: 'cus_123',
      latest_charge: 'ch_123',
    };

    it('should handle off-session payment intent', async () => {
      stripeMock.paymentIntents.confirm = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      const result = await service.handlePaymentIntent(
        'pi_123',
        'pm_123',
        true,
      );

      expect(stripeMock.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
        off_session: true,
      });
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should handle on-session payment intent', async () => {
      stripeMock.paymentIntents.update = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);
      stripeMock.paymentIntents.retrieve = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      const result = await service.handlePaymentIntent(
        'pi_123',
        'pm_123',
        false,
      );

      expect(stripeMock.paymentIntents.update).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
      });
      expect(result).toEqual(mockPaymentIntent);
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
      expect(result).toEqual(mockInvoice);
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
        address: mockCustomer.address,
        default_payment_method:
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

  describe('tax ID operations', () => {
    it('should create tax ID successfully', async () => {
      const mockTaxId = {
        id: 'txi_123',
        type: VatType.EU_VAT,
        value: 'DE123456789',
      };
      stripeMock.customers.createTaxId = jest.fn().mockResolvedValue(mockTaxId);

      const result = await service.createTaxId(
        'cus_123',
        VatType.EU_VAT,
        'DE123456789',
      );

      expect(stripeMock.customers.createTaxId).toHaveBeenCalledWith('cus_123', {
        type: VatType.EU_VAT,
        value: 'DE123456789',
      });
      expect(result).toEqual(mockTaxId);
    });

    it('should list tax IDs successfully', async () => {
      const mockTaxIds = { data: [{ id: 'txi_123' }] };
      stripeMock.customers.listTaxIds = jest.fn().mockResolvedValue(mockTaxIds);

      const result = await service.listCustomerTaxIds('cus_123');

      expect(stripeMock.customers.listTaxIds).toHaveBeenCalledWith('cus_123');
      expect(result).toEqual(mockTaxIds.data);
    });

    it('should delete tax ID successfully', async () => {
      stripeMock.customers.deleteTaxId = jest.fn().mockResolvedValue({});

      await service.deleteTaxId('cus_123', 'txi_123');

      expect(stripeMock.customers.deleteTaxId).toHaveBeenCalledWith(
        'cus_123',
        'txi_123',
      );
    });
  });
});
