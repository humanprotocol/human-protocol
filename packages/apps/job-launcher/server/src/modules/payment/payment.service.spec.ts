import { ethers } from 'ethers';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';
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
import { ChainId } from '@human-protocol/sdk';

jest.mock('@human-protocol/sdk');

describe('PaymentService', () => {
  let stripe: Stripe;
  let paymentService: PaymentService;
  let paymentRepository: PaymentRepository;
  let currencyService: CurrencyService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: ChainId.LOCALHOST }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string, defaultValue?: any) => {
        switch (key) {
          case 'STRIPE_SECRET_KEY':
            return 'test-secret';
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
      exports: [CurrencyService],
    }).compile();
  
    paymentService = moduleRef.get<PaymentService>(PaymentService);
    paymentRepository = moduleRef.get(PaymentRepository);
    currencyService = moduleRef.get(CurrencyService);
  
    const stripeCustomersCreateMock = jest.fn();
    const stripePaymentIntentsCreateMock = jest.fn();
  
    stripe = {
      customers: {
        create: stripeCustomersCreateMock,
      },
      paymentIntents: {
        create: stripePaymentIntentsCreateMock,
      },
    } as any;
  
    paymentService['stripe'] = stripe;
  
    jest.spyOn(stripe.customers, 'create').mockImplementation(stripeCustomersCreateMock);
    jest.spyOn(stripe.paymentIntents, 'create').mockImplementation(stripePaymentIntentsCreateMock);
  });

  describe('createCustomer', () => {
    let createCustomerMock: any;

    beforeEach(() => {
      createCustomerMock = jest.spyOn(stripe.customers, 'create');
    });

    afterEach(() => {
      expect(createCustomerMock).toHaveBeenCalledTimes(1);
      expect(createCustomerMock).toHaveBeenCalledWith({
        email: MOCK_EMAIL,
      });
      createCustomerMock.mockRestore();
    });

    it('should create a customer', async () => {
      const stripeApiResponse = {
        id: MOCK_CUSTOMER_ID,
        email: MOCK_EMAIL,
      };

      createCustomerMock.mockResolvedValue(
          stripeApiResponse as Stripe.Response<Stripe.Customer>,
        );

      const result = await paymentService.createCustomer(MOCK_EMAIL);

      expect(result).toBe(MOCK_CUSTOMER_ID);
    });

    it('should throw bad request exception if customer creation fails', async () => {
      createCustomerMock.mockRejectedValue(new Error());

      expect(paymentService.createCustomer(MOCK_EMAIL)).rejects.toThrowError();
    });
  });

  describe('createFiatPayment', () => {
    let createPaymentIntentMock: any;
  
    beforeEach(() => {
      createPaymentIntentMock = jest.spyOn(stripe.paymentIntents, 'create');
    });
  
    afterEach(() => {
      expect(createPaymentIntentMock).toHaveBeenCalledTimes(1);
      createPaymentIntentMock.mockRestore();
    });
  
    it('should create a fiat payment successfully', async () => {
      const customerId = MOCK_CUSTOMER_ID;
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };
  
      const paymentIntent = {
        client_secret: 'clientSecret123',
      };
  
      createPaymentIntentMock.mockResolvedValue(paymentIntent);
  
      const result = await paymentService.createFiatPayment(customerId, dto);
  
      expect(createPaymentIntentMock).toHaveBeenCalledWith({
        payment_method_types: [PaymentFiatMethodType.CARD],
        amount: dto.amount * 100,
        currency: dto.currency,
        confirm: true,
        customer: customerId,
        payment_method_options: {},
      });
      expect(result).toEqual(paymentIntent.client_secret);
    });
  
    it('should throw a bad request exception if the payment intent creation fails', async () => {
      const customerId = MOCK_CUSTOMER_ID;
  
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };
  
      createPaymentIntentMock.mockRejectedValue(new Error());
  
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
        currency: Currency.EUR
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
        Currency.EUR,
        PaymentType.DEPOSIT,
        BigNumber.from(paymentData.amount),
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

  describe('confirmFiatPayment', () => {
    let getPaymentMock: any,
        savePaymentMock: any,
        getRateMock: any;

    beforeEach(() => {
      getPaymentMock = jest.spyOn(paymentService, 'getPayment');
      savePaymentMock = jest.spyOn(paymentService, 'savePayment');
      getRateMock = jest.spyOn(currencyService, 'getRate');
    });
  
    afterEach(() => {
      jest.restoreAllMocks();
    });
  
    it('should confirm a fiat payment successfully', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };
      const rate = 1.5;
  
      const paymentData = {
        status: 'succeeded',
        amount: 100,
        currency: Currency.EUR
      };
  
      getPaymentMock.mockResolvedValue(paymentData);
      savePaymentMock.mockResolvedValue(true);
      getRateMock.mockResolvedValue(rate);
  
      const result = await paymentService.confirmFiatPayment(userId, dto);
  
      expect(paymentService.getPayment).toHaveBeenCalledWith(dto.paymentId);
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.FIAT,
        Currency.USD,
        Currency.EUR,
        PaymentType.DEPOSIT,
        BigNumber.from(paymentData.amount),
      );
      expect(result).toBe(true);
    });
  
    it('should throw a bad request exception if the payment is not successful', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };
  
      const paymentData = {
        status: 'canceled',
        amount: 100,
      };
  
      getPaymentMock.mockResolvedValue(paymentData);
  
      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.NotSuccess);
    });
  
    it('should return false if the payment is not found', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };
  
      getPaymentMock.mockResolvedValue(null);
  
      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.NotFound);
    });
  });

  describe('createCryptoPayment', () => {
    let jsonRpcProviderMock: any,
        findOneMock: any,
        savePaymentMock: any;

    const mockTokenContract: any = {
      symbol: jest.fn(),
    };
  
    beforeEach(() => {
      jsonRpcProviderMock = {
        getTransactionReceipt: jest.fn(),
      };
  
      jest
        .spyOn(ethers.providers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);
  
      jest.spyOn(HMToken__factory, 'connect').mockReturnValue(mockTokenContract);
      jest.spyOn(mockTokenContract, 'symbol');
      findOneMock = jest.spyOn(paymentRepository, 'findOne');
      savePaymentMock = jest.spyOn(paymentService, 'savePayment');
    });
  
    afterEach(() => {
      jest.restoreAllMocks();
    });
  
    it('should create a crypto payment successfully', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.LOCALHOST,
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
            topics: [
              '0x123',
              '0x0000000000000000000000000123',
              MOCK_ADDRESS,
            ],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };
  
      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(transactionReceipt);
  
      mockTokenContract.symbol.mockResolvedValue(token);
      findOneMock.mockResolvedValue(null);
      savePaymentMock.mockResolvedValue(true);
  
      const result = await paymentService.createCryptoPayment(userId, dto);
  
      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        transactionHash: dto.transactionHash,
      });
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.CRYPTO,
        Currency.USD,
        TokenId.HMT,
        PaymentType.DEPOSIT,
        BigNumber.from('100'),
        MOCK_TRANSACTION_HASH
      );
      expect(result).toBe(true);
    });
  
    it('should throw a conflict exception if an unsupported token is used', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.LOCALHOST,
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
            topics: [
              '0x123',
              '0x0000000000000000000000000123',
              MOCK_ADDRESS,
            ],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };
  
      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(transactionReceipt);
  
      mockTokenContract.symbol.mockResolvedValue(unsupportedToken);
  
      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.UnsupportedToken);
    });
  
    it('should throw a not found exception if the transaction is not found by hash', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.LOCALHOST,
        transactionHash: MOCK_TRANSACTION_HASH,
      };
  
      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(null);
  
      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.TransactionNotFoundByHash);
    });
  
    it('should throw a not found exception if the transaction data is invalid', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.LOCALHOST,
        transactionHash: MOCK_TRANSACTION_HASH,
      };
  
      const transactionReceipt: Partial<TransactionReceipt> = {
        logs: [],
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };
  
      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(transactionReceipt);
  
      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.InvalidTransactionData);
    });
  
    it('should throw a not found exception if the transaction has insufficient confirmations', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.LOCALHOST,
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
            topics: [
              '0x123',
              '0x0000000000000000000000000123',
              MOCK_ADDRESS,
            ],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD - 1,
      };
  
      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(transactionReceipt);
  
      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(
        ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
      );
    });
  
    it('should throw a bad request exception if the payment with the same transaction hash already exists', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.LOCALHOST,
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
            topics: [
              '0x123',
              '0x0000000000000000000000000123',
              MOCK_ADDRESS,
            ],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };
  
      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(transactionReceipt);
  
      mockTokenContract.symbol.mockResolvedValue(token);
  
      findOneMock.mockResolvedValue({} as any);
  
      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.TransactionHashAlreadyExists);
    });
  });
});
