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
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { Currency, PaymentFiatMethodType, PaymentSource, PaymentStatus, PaymentType } from 'src/common/enums/payment';
import { TX_CONFIRMATION_TRESHOLD } from 'src/common/constants';

const MOCK_REQUESTER_TITLE = 'Mock job title',
      MOCK_REQUESTER_DESCRIPTION = 'Mock job description',
      MOCK_FORTUNES_REQUIRED = 5,
      MOCK_CHAIN_ID = 1,
      MOCK_ADDRESS = '0x1234567890abcdef',
      MOCK_FILE_URL = 'mockedFileUrl',
      MOCK_FILE_HASH = 'mockedFileHash',
      MOCK_FILE_KEY = 'manifest.json',
      MOCK_PRIVATE_KEY =
        'd334daf65a631f40549cc7de126d5a0016f32a2d00c49f94563f9737f7135e55',
      MOCK_TRANSACTION_HASH = '0xd28e4c40571530afcb25ea1890e77b2d18c35f06049980ca4fb71829f64d89dc',
      MOCK_BUCKET_NAME = 'bucket-name',
      MOCK_STRIPE_SECRET_KEY = 'secrete key',
      MOCK_STRIPE_API_VERSION = '2022-11-15',
      MOCK_STRIPE_APP_NAME = 'Some name',
      MOCK_STRIPE_APP_VERSION = '0.0.1',
      MOCK_STRIPE_APP_INFO_URL = 'some url' 

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


    stripe = new Stripe(
      MOCK_STRIPE_SECRET_KEY
      {
        apiVersion: MOCK_STRIPE_API_VERSION,
        appInfo: {
          name: MOCK_STRIPE_APP_NAME,
          version: MOCK_STRIPE_APP_VERSION,
          url: MOCK_STRIPE_APP_INFO_URL,
        },
      },
    );
    
    paymentService = moduleRef.get<PaymentService>(PaymentService);
    paymentRepository = moduleRef.get(PaymentRepository);
    currencyService = moduleRef.get(CurrencyService);
    configService = moduleRef.get(ConfigService);
    httpService = moduleRef.get(HttpService);
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const email = 'test@example.com';

      const customer = {
        id: '123',
        object: 'customer',
        balance: 1,
        created: new Date(),
        default_source: null,
        description: null,
        email: null,
        invoice_settings: {
          custom_fields: null,
          default_payment_method: null,
          footer: null,
          rendering_options: null
        },
        livemode: false,
        metadata: [{some: 'data'}],
        shipping: null
      };

      jest.spyOn(stripe.customers, 'create').mockResolvedValue(customer);

      const result = await paymentService.createCustomer(email);

      expect(stripe.customers.create).toHaveBeenCalledWith({ email });
      expect(result).toBe(customer.id);
    });

    it('should throw a NotFoundException if the customer was not found', async () => {
      const email = 'test@example.com';

      jest.spyOn(stripe.customers, 'create').mockResolvedValue(null);

      await expect(paymentService.createCustomer(email)).rejects.toThrowError(
        new NotFoundException(ErrorPayment.CustomerNotFound)
      );
    });
  });

  describe('createFiatPayment', () => {
    it('should create a fiat payment successfully', async () => {
      const customerId = 'customer123';
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      const paymentIntent = {
        client_secret: 'clientSecret123',
      };

      jest.spyOn(stripe.paymentIntents, 'create').mockResolvedValue(paymentIntent);

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
  });

  describe('confirmFiatPayment', () => {
    it('should confirm a fiat payment successfully', async () => {
      const userId = 1;
      const dto = {
        paymentId: 'payment123',
      };

      const paymentData = {
        status: PaymentStatus.SUCCEEDED,
        amount: '100',
      };

      jest.spyOn(paymentService, 'getPayment').mockResolvedValue(paymentData);
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

    it('should throw a not found exception if the payment is not successful', async () => {
      const userId = 1;
      const dto = {
        paymentId: 'payment123',
      };

      const paymentData = {
        status: PaymentStatus.FAILED,
        amount: '100',
      };

      jest.spyOn(paymentService, 'getPayment').mockResolvedValue(paymentData);

      await expect(paymentService.confirmFiatPayment(userId, dto)).rejects.toThrowError(
        new NotFoundException(ErrorPayment.NotSuccess)
      );
    });

    it('should return false if the payment is not found', async () => {
      const userId = 1;
      const dto = {
        paymentId: 'payment123',
      };

      jest.spyOn(paymentService, 'getPayment').mockResolvedValue(null);

      const result = await paymentService.confirmFiatPayment(userId, dto);

      expect(result).toBe(false);
    });
  });

  describe('createCryptoPayment', () => {
    it('should create a crypto payment successfully', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const transactionReceipt: TransactionReceipt = {
        logs: [
          {
            data: '100'
          },
        ],
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      jest.spyOn(ethers.providers, 'JsonRpcProvider').mockImplementation(() => ({
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt),
      }));

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

      jest.spyOn(ethers.providers, 'JsonRpcProvider').mockImplementation(() => ({
        getTransactionReceipt: jest.fn().mockResolvedValue(null),
      }));

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

      const transactionReceipt: TransactionReceipt = {
        logs: [],
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      jest.spyOn(ethers.providers, 'JsonRpcProvider').mockImplementation(() => ({
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt),
      }));

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

      const transactionReceipt: TransactionReceipt = {
        logs: [
          {
            data: '100',
          },
        ],
        confirmations: TX_CONFIRMATION_TRESHOLD - 1, // Fewer confirmations than required
      };

      jest.spyOn(providers, 'JsonRpcProvider').mockImplementation(() => ({
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt),
      }));

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

      const transactionReceipt: TransactionReceipt = {
        logs: [
          {
            data: '100',
          },
        ],
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      jest.spyOn(ethers.providers, 'JsonRpcProvider').mockImplementation(() => ({
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt),
      }));

      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue({} as any); // Mock an existing payment entity

      await expect(
        paymentService.createCryptoPayment(userId, dto)
      ).rejects.toThrowError(new BadRequestException(ErrorPayment.TransactionHashAlreadyExists));
    });
  });
});

