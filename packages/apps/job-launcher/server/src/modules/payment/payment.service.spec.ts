import { ethers } from 'ethers';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BigNumber } from 'ethers';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ErrorPayment } from '../../common/constants/errors';
import { CurrencyService } from './currency.service';
import { TransactionReceipt, Log } from "@ethersproject/abstract-provider";
import { Currency, PaymentFiatMethodType, PaymentSource, PaymentType } from '../../common/enums/payment';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';

const MOCK_ADDRESS = '0x1234567890abcdef',
      MOCK_TRANSACTION_HASH = '0xd28e4c40571530afcb25ea1890e77b2d18c35f06049980ca4fb71829f64d89dc',
      MOCK_STRIPE_SECRET_KEY = 'secrete_key',
      MOCK_STRIPE_API_VERSION = '2022-11-15',
      MOCK_STRIPE_APP_NAME = 'Some name',
      MOCK_STRIPE_APP_VERSION = '0.0.1',
      MOCK_STRIPE_APP_INFO_URL = 'some url',
      MOCK_STRIPE_ENDPOINT_SECRETE = 'secrete-key'

jest.mock('@human-protocol/sdk');

describe('PaymentService', () => {
  let stripe: Stripe;
  let paymentService: PaymentService;
  let paymentRepository: DeepMocked<PaymentRepository>;
  let currencyService: DeepMocked<CurrencyService>;
  let configService: DeepMocked<ConfigService>;
  let httpService: DeepMocked<HttpService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PaymentRepository, useValue: createMock<PaymentRepository>() },
        { provide: CurrencyService, useValue: createMock<CurrencyService>() },
        { provide: ConfigService, useValue: createMock<ConfigService>() },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
    paymentRepository = moduleRef.get(PaymentRepository);
    currencyService = moduleRef.get(CurrencyService);
    configService = moduleRef.get(ConfigService);
    httpService = moduleRef.get(HttpService);

    jest.spyOn(configService, 'get' as any)
        .mockImplementationOnce(() => MOCK_STRIPE_SECRET_KEY)
        .mockImplementationOnce(() => MOCK_STRIPE_API_VERSION)
        .mockImplementationOnce(() => MOCK_STRIPE_APP_NAME)
        .mockImplementationOnce(() => MOCK_STRIPE_APP_VERSION)
        .mockImplementationOnce(() => MOCK_STRIPE_APP_INFO_URL)
        .mockImplementationOnce(() => MOCK_STRIPE_ENDPOINT_SECRETE)

    stripe = {
      customers: {
        create: jest.fn(),
      },
      paymentIntents: {
        create: jest.fn(),
      }
    } as any;
  });

  describe('createCustomer', () => {
    it.only('should create a customer with the given email', async () => {
      const email = 'test@example.com';
      const createdCustomer = { id: 'customer_id', email };

      jest.spyOn(stripe.customers, 'create').mockResolvedValue(createdCustomer as Stripe.Response<Stripe.Customer>);

      const result = await paymentService.createCustomer(email);

      expect(result).toEqual(createdCustomer);
      expect(stripe.customers.create).toHaveBeenCalledWith({ email });
    });

    it('should throw a NotFoundException if customer creation fails', async () => {
      const email = 'test@example.com';

      jest.spyOn(stripe.customers, 'create').mockRejectedValue(new Error());

      await expect(
        paymentService.createCustomer(email)
      ).rejects.toThrowError(new NotFoundException(ErrorPayment.CustomerNotFound));
      expect(stripe.customers.create).toHaveBeenCalledWith({ email });
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const email = 'test@example.com';

      const customer: Partial<Stripe.Response<Stripe.Customer>> = {
        id: '123'
      };

      jest.spyOn(stripe.customers, 'create').mockResolvedValue(customer as Stripe.Response<Stripe.Customer>);

      const result = await paymentService.createCustomer(email);

      expect(stripe.customers.create).toHaveBeenCalledWith({ email });
      expect(result).toBe(customer.id);
    });

    it('should throw a not found exception if the customer creation fails', async () => {
      const email = 'test@example.com';

      jest.spyOn(stripe.customers, 'create').mockRejectedValue(new Error());

      await expect(
        paymentService.createCustomer(email)
      ).rejects.toThrowError(new NotFoundException(ErrorPayment.CustomerNotFound));
    });
  });

  describe('createFiatPayment', () => {
    it('should create a fiat payment successfully', async () => {
      const customerId = 'customer123';
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      const paymentIntent: Partial<Stripe.Response<Stripe.PaymentIntent>> = {
        client_secret: 'clientSecret123',
      };

      jest.spyOn(stripe.paymentIntents, 'create').mockResolvedValue(paymentIntent as Stripe.Response<Stripe.PaymentIntent>);

      const result = await paymentService.createFiatPayment(customerId, dto);

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        payment_method_types: [PaymentFiatMethodType.CARD],
        amount: dto.amount * 100,
        currency: dto.currency,
        confirm: true,
        customer: customerId,
        payment_method_options: {},
      });
      expect(result).toEqual({
        clientSecret: paymentIntent.client_secret,
      });
    });

    it('should throw a bad request exception if the payment intent creation fails', async () => {
      const customerId = 'customer123';

      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      jest.spyOn(stripe.paymentIntents, 'create').mockRejectedValue(new Error());

      await expect(
        paymentService.createFiatPayment(customerId, dto)
      ).rejects.toThrowError(new BadRequestException(ErrorPayment.IntentNotCreated));
    });
  });

  describe('confirmFiatPayment', () => {
    it('should confirm a fiat payment successfully', async () => {
      const userId = 1;
      const dto = {
        paymentId: 'payment123',
      };

      const paymentData: Partial<Stripe.Response<Stripe.PaymentIntent>> = {
        status: 'succeeded',
        amount: 100,
      };

      jest.spyOn(paymentService, 'getPayment').mockResolvedValue(paymentData as Stripe.Response<Stripe.PaymentIntent>);
      jest.spyOn(paymentService, 'savePayment').mockResolvedValue(true);

      const result = await paymentService.confirmFiatPayment(userId, dto);

      expect(paymentService.getPayment).toHaveBeenCalledWith(dto.paymentId);
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.FIAT,
        PaymentType.DEPOSIT,
        BigNumber.from(paymentData.amount),
      );
      expect(result).toBe(true);
    });

    it('should throw a bad request exception if the payment is not successful', async () => {
      const userId = 1;
      const dto = {
        paymentId: 'payment123',
      };

      const paymentData: Partial<Stripe.Response<Stripe.PaymentIntent>> = {
        status: 'canceled',
        amount: 100,
      };

      jest.spyOn(paymentService, 'getPayment').mockResolvedValue(paymentData as Stripe.Response<Stripe.PaymentIntent>);

      await expect(paymentService.confirmFiatPayment(userId, dto)).rejects.toThrowError(
        new BadRequestException(ErrorPayment.NotSuccess)
      );
    });

    it('should return false if the payment is not found', async () => {
      const userId = 1;
      const dto = {
        paymentId: 'payment123',
      };

      jest.spyOn(paymentService, 'getPayment').mockResolvedValue(null);

      await expect(paymentService.confirmFiatPayment(userId, dto)).rejects.toThrowError(
        new NotFoundException(ErrorPayment.NotFound)
      );
    });
  });

  describe('createCryptoPayment', () => {
    it('should create a crypto payment successfully', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const transactionReceipt: Partial<TransactionReceipt> = {
        logs: [
          {
            data: '100',
            blockNumber: 123,
            blockHash: '123',
            transactionIndex: 123,
            removed: false,
            address: MOCK_ADDRESS,
            topics: [],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      const provider = new ethers.providers.JsonRpcProvider();

      jest.spyOn(provider, 'getTransactionReceipt').mockResolvedValue(transactionReceipt as TransactionReceipt)

      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue(null);

      jest.spyOn(paymentService, 'savePayment').mockResolvedValue(true);

      const result = await paymentService.createCryptoPayment(userId, dto);

      expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(
        expect.any(String)
      );
      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        transactionHash: dto.transactionHash,
      });
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.CRYPTO,
        PaymentType.DEPOSIT,
        BigNumber.from('100')
      );
      expect(result).toBe(true);
    });

    it('should throw a not found exception if the transaction is not found by hash', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const provider = new ethers.providers.JsonRpcProvider();

      jest.spyOn(provider, 'getTransactionReceipt').mockResolvedValue({} as TransactionReceipt)

      await expect(
        paymentService.createCryptoPayment(userId, dto)
      ).rejects.toThrowError(new NotFoundException(ErrorPayment.TransactionNotFoundByHash));
    });

    it('should throw a not found exception if the transaction data is invalid', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const transactionReceipt: Partial<TransactionReceipt> = {
        logs: [],
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      const provider = new ethers.providers.JsonRpcProvider();

      jest.spyOn(provider, 'getTransactionReceipt').mockResolvedValue(transactionReceipt as TransactionReceipt)

      await expect(
        paymentService.createCryptoPayment(userId, dto)
      ).rejects.toThrowError(new NotFoundException(ErrorPayment.InvalidTransactionData));
    });

    it('should throw a not found exception if the transaction has insufficient confirmations', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const transactionReceipt: Partial<TransactionReceipt> = {
        logs: [
          {
            data: '100',
            blockNumber: 123,
            blockHash: '123',
            transactionIndex: 123,
            removed: false,
            address: MOCK_ADDRESS,
            topics: [],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        confirmations: TX_CONFIRMATION_TRESHOLD - 1, // Fewer confirmations than required
      };

      const provider = new ethers.providers.JsonRpcProvider();

      jest.spyOn(provider, 'getTransactionReceipt').mockResolvedValue(transactionReceipt as TransactionReceipt)

      await expect(
        paymentService.createCryptoPayment(userId, dto)
      ).rejects.toThrowError(new NotFoundException(ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations));
    });

    it('should throw a bad request exception if the payment with the same transaction hash already exists', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const transactionReceipt: Partial<TransactionReceipt> = {
        logs: [
          {
            data: '100',
            blockNumber: 123,
            blockHash: '123',
            transactionIndex: 123,
            removed: false,
            address: MOCK_ADDRESS,
            topics: [],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      const provider = new ethers.providers.JsonRpcProvider();

      jest.spyOn(provider, 'getTransactionReceipt').mockResolvedValue(transactionReceipt as TransactionReceipt)

      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue({} as any); // Mock an existing payment entity

      await expect(
        paymentService.createCryptoPayment(userId, dto)
      ).rejects.toThrowError(new BadRequestException(ErrorPayment.TransactionHashAlreadyExists));
    });
  });
});

