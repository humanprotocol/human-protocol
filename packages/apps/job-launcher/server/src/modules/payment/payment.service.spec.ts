import { ethers } from 'ethers';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';
import { BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BigNumber } from 'ethers';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ErrorPayment } from '../../common/constants/errors';
import { CurrencyService } from './currency.service';
import { TransactionReceipt, Log } from '@ethersproject/abstract-provider';
import {
  Currency,
  PaymentFiatMethodType,
  PaymentSource,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';
import {
  MOCK_ADDRESS,
  MOCK_CUSTOMER_ID,
  MOCK_EMAIL,
  MOCK_PAYMENT_ID,
  MOCK_TRANSACTION_HASH,
} from '../../common/test/constants';
import { Web3Service } from '../web3/web3.service';
import { HMToken__factory } from '@human-protocol/core/typechain-types';

jest.mock('@human-protocol/sdk');

describe('PaymentService', () => {
  let stripe: Stripe;
  let paymentService: PaymentService;
  let paymentRepository: PaymentRepository;
  let currencyService: CurrencyService;
  let configService: ConfigService;
  let httpService: HttpService;

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string, defaultValue?: any) => {
        switch (key) {
          case 'STRIPE_SECRET_KEY':
            return 'test-secrete';
          case 'STRIPE_API_VERSION':
            return '2022-11-15';
          case 'NAME':
            return 'Fortune';
          case 'VERSION':
            return '0.0.1';
          case 'STRIPE_APP_INFO_URL':
            return 'https://test-app-url.com';
          default:
            return defaultValue;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: createMock<PaymentRepository>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: CurrencyService, useValue: createMock<CurrencyService>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
      exports: [CurrencyService]
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
    paymentRepository = moduleRef.get(PaymentRepository);
    currencyService = moduleRef.get(CurrencyService);
    configService = moduleRef.get(ConfigService);
    httpService = moduleRef.get(HttpService);

    stripe = {
      customers: {
        create: jest.fn(),
      },
      paymentIntents: {
        create: jest.fn(),
      },
    } as any;

    paymentService['stripe'] = stripe as Stripe;
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const stripeApiResponse = {
        id: MOCK_CUSTOMER_ID,
        email: MOCK_EMAIL,
      };

      jest
        .spyOn(stripe.customers, 'create')
        .mockResolvedValue(
          stripeApiResponse as Stripe.Response<Stripe.Customer>,
        );

      const result = await paymentService.createCustomer(MOCK_EMAIL);

      expect(result).toBe(MOCK_CUSTOMER_ID);
      expect(stripe.customers.create).toHaveBeenCalledTimes(1);
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: MOCK_EMAIL,
      });
    });

    it('should throw bad request exception if customer creation fails', async () => {
      jest.spyOn(stripe.customers, 'create').mockRejectedValue(new Error());

      expect(paymentService.createCustomer(MOCK_EMAIL)).rejects.toThrowError();
      expect(stripe.customers.create).toHaveBeenCalledTimes(1);
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: MOCK_EMAIL,
      });
    });
  });

  describe('createFiatPayment', () => {
    it('should create a fiat payment successfully', async () => {
      const customerId = MOCK_CUSTOMER_ID;
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      const paymentIntent: Partial<Stripe.Response<Stripe.PaymentIntent>> = {
        client_secret: 'clientSecret123',
      };

      jest
        .spyOn(stripe.paymentIntents, 'create')
        .mockResolvedValue(
          paymentIntent as Stripe.Response<Stripe.PaymentIntent>,
        );

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
      const customerId = MOCK_CUSTOMER_ID;

      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      jest
        .spyOn(stripe.paymentIntents, 'create')
        .mockRejectedValue(new Error());

      await expect(
        paymentService.createFiatPayment(customerId, dto),
      ).rejects.toThrowError();
    });
  });

  describe('confirmFiatPayment', () => {
    it('should confirm a fiat payment successfully', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };
      const rate = 1.5;

      const paymentData: Partial<Stripe.Response<Stripe.PaymentIntent>> = {
        status: 'succeeded',
        amount: 100,
        currency: 'USD'
      };

      jest
        .spyOn(paymentService, 'getPayment')
        .mockResolvedValue(
          paymentData as Stripe.Response<Stripe.PaymentIntent>,
        );
      jest.spyOn(paymentService, 'savePayment').mockResolvedValue(true);

      jest.spyOn(currencyService, 'getRate').mockResolvedValue(rate);

      const result = await paymentService.confirmFiatPayment(userId, dto);

      expect(paymentService.getPayment).toHaveBeenCalledWith(dto.paymentId);
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.FIAT,
        Currency.USD,
        PaymentType.DEPOSIT,
        BigNumber.from(paymentData.amount),
        1 / rate
      );
      expect(result).toBe(true);
    });

    it('should throw a bad request exception if the payment is not successful', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      const paymentData: Partial<Stripe.Response<Stripe.PaymentIntent>> = {
        status: 'canceled',
        amount: 100,
      };

      jest
        .spyOn(paymentService, 'getPayment')
        .mockResolvedValue(
          paymentData as Stripe.Response<Stripe.PaymentIntent>,
        );

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.NotSuccess);
    });

    it('should return false if the payment is not found', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      jest.spyOn(paymentService, 'getPayment').mockResolvedValue(null);

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.NotFound);
    });
  });

  describe('createCryptoPayment', () => {
    const mockTokenContract: any = {
      symbol: jest.fn(),
    };
    
    it('should create a crypto payment successfully', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const token = 'hmt';

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
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      const jsonRpcProviderMock = {
        getTransactionReceipt: jest
          .fn()
          .mockResolvedValue(transactionReceipt as TransactionReceipt),
      };

      jest
        .spyOn(ethers.providers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);

      jest.spyOn(HMToken__factory, 'connect').mockReturnValue(mockTokenContract);

      jest.spyOn(mockTokenContract, 'symbol').mockResolvedValue(token);

      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue(null);

      jest.spyOn(paymentService, 'savePayment').mockResolvedValue(true);

      const result = await paymentService.createCryptoPayment(userId, dto);

      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        transactionHash: dto.transactionHash,
      });
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.CRYPTO,
        TokenId.HMT,
        PaymentType.DEPOSIT,
        BigNumber.from('100'),
        {},
        MOCK_TRANSACTION_HASH
      );
      expect(result).toBe(true);
    });

    it('should throw a conflict exception if an unsupported token is used', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const unsupportedToken = 'doge';

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
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      const jsonRpcProviderMock = {
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt as TransactionReceipt),
      };

      jest
        .spyOn(ethers.providers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);

      jest.spyOn(HMToken__factory, 'connect').mockReturnValue(mockTokenContract);

      jest.spyOn(mockTokenContract, 'symbol').mockResolvedValue(unsupportedToken);

      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.UnsupportedToken);
    });

    it('should throw a not found exception if the transaction is not found by hash', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const jsonRpcProviderMock = {
        getTransactionReceipt: jest.fn().mockResolvedValue(null),
      };

      jest
        .spyOn(ethers.providers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);

      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.TransactionNotFoundByHash);
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

      const jsonRpcProviderMock = {
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt),
      };

      jest
        .spyOn(ethers.providers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);

      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.InvalidTransactionData);
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
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD - 1,
      };

      const jsonRpcProviderMock = {
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt),
      };

      jest
        .spyOn(ethers.providers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);

      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(
        ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
      );
    });

    it('should throw a bad request exception if the payment with the same transaction hash already exists', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const token = 'hmt';

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
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      const jsonRpcProviderMock = {
        getTransactionReceipt: jest.fn().mockResolvedValue(transactionReceipt),
      };

      jest
        .spyOn(ethers.providers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);

      jest.spyOn(HMToken__factory, 'connect').mockReturnValue(mockTokenContract);

      jest.spyOn(mockTokenContract, 'symbol').mockResolvedValue(token);

      jest.spyOn(paymentRepository, 'findOne').mockResolvedValue({} as any);

      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.TransactionHashAlreadyExists);
    });
  });
});
