import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeConfigService } from '../../common/config/stripe-config.service';
import Stripe from 'stripe';
import { ServerError } from '../../common/errors';
import { ErrorPayment } from '../../common/constants/errors';
import { VatType } from '../../common/enums/payment';

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
    stripeMock = new Stripe('dummy_key') as jest.Mocked<Stripe>;
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
      expect(stripeMock.customers.create).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should handle errors when creating customer', async () => {
      stripeMock.customers.create = jest.fn().mockRejectedValue(new Error('Stripe error'));

      await expect(service.createCustomer('test@example.com')).rejects.toThrow(
        new ServerError(ErrorPayment.CustomerNotCreated),
      );
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('createSetupIntentAndReturnSecret', () => {
    const mockSetupIntent = {
      client_secret: 'seti_secret_123',
    };

    it('should create setup intent successfully', async () => {
      stripeMock.setupIntents.create = jest.fn().mockResolvedValue(mockSetupIntent);

      const result = await service.createSetupIntentAndReturnSecret('cus_123');

      expect(result).toBe('seti_secret_123');
      expect(stripeMock.setupIntents.create).toHaveBeenCalledWith({
        automatic_payment_methods: { enabled: true },
        customer: 'cus_123',
      });
    });

    it('should handle null customerId', async () => {
      stripeMock.setupIntents.create = jest.fn().mockResolvedValue(mockSetupIntent);

      await service.createSetupIntentAndReturnSecret(null);

      expect(stripeMock.setupIntents.create).toHaveBeenCalledWith({
        automatic_payment_methods: { enabled: true },
        customer: undefined,
      });
    });

    it('should handle missing client secret', async () => {
      stripeMock.setupIntents.create = jest.fn().mockResolvedValue({});

      await expect(service.createSetupIntentAndReturnSecret('cus_123')).rejects.toThrow(
        new ServerError(ErrorPayment.ClientSecretDoesNotExist),
      );
    });
  });

  describe('handlePaymentIntent', () => {
    const mockPaymentIntent = {
      id: 'pi_123',
      client_secret: 'pi_secret_123',
    };

    it('should handle off-session payment intent', async () => {
      stripeMock.paymentIntents.confirm = jest.fn().mockResolvedValue({});
      stripeMock.paymentIntents.retrieve = jest.fn().mockResolvedValue(mockPaymentIntent);

      const result = await service.handlePaymentIntent('pi_123', 'pm_123', true);

      expect(stripeMock.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
        off_session: true,
      });
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should handle on-session payment intent', async () => {
      stripeMock.paymentIntents.update = jest.fn().mockResolvedValue({});
      stripeMock.paymentIntents.retrieve = jest.fn().mockResolvedValue(mockPaymentIntent);

      const result = await service.handlePaymentIntent('pi_123', 'pm_123', false);

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
    };

    it('should create invoice successfully', async () => {
      stripeMock.invoices.create = jest.fn().mockResolvedValue({ id: 'inv_123' });
      stripeMock.invoiceItems.create = jest.fn().mockResolvedValue({});
      stripeMock.invoices.finalizeInvoice = jest.fn().mockResolvedValue(mockInvoice);

      const result = await service.createInvoice('cus_123', 1000, 'usd', 'Test invoice');

      expect(stripeMock.invoices.create).toHaveBeenCalled();
      expect(stripeMock.invoiceItems.create).toHaveBeenCalled();
      expect(stripeMock.invoices.finalizeInvoice).toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
    });

    it('should throw error when payment intent is missing', async () => {
      stripeMock.invoices.create = jest.fn().mockResolvedValue({ id: 'inv_123' });
      stripeMock.invoiceItems.create = jest.fn().mockResolvedValue({});
      stripeMock.invoices.finalizeInvoice = jest.fn().mockResolvedValue({ id: 'inv_123' });

      await expect(
        service.createInvoice('cus_123', 1000, 'usd', 'Test invoice'),
      ).rejects.toThrow(new ServerError(ErrorPayment.IntentNotCreated));
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_123',
        name: 'Updated Name',
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

      expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_123', updateData);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('tax ID operations', () => {
    it('should create tax ID successfully', async () => {
      const mockTaxId = { id: 'txi_123', type: VatType.EU_VAT, value: 'DE123456789' };
      stripeMock.customers.createTaxId = jest.fn().mockResolvedValue(mockTaxId);

      const result = await service.createTaxId('cus_123', VatType.EU_VAT, 'DE123456789');

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

      expect(stripeMock.customers.deleteTaxId).toHaveBeenCalledWith('cus_123', 'txi_123');
    });
  });
}); 