import { ethers } from 'ethers';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BigNumber } from 'ethers';
import { createMock } from '@golevelup/ts-jest';
import { ErrorPayment } from '../../common/constants/errors';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  StripePaymentStatus,
  TokenId,
} from '../../common/enums/payment';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';
import {
  MOCK_ADDRESS,
  MOCK_PAYMENT_ID,
  MOCK_TRANSACTION_HASH,
} from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { ChainId } from '@human-protocol/sdk';
import { PaymentEntity } from './payment.entity';

jest.mock('@human-protocol/sdk');

jest.mock('../../common/utils', () => ({
  getRate: jest.fn().mockImplementation(() => 0.5)
}));

describe('PaymentService', () => {
  let stripe: Stripe;
  let paymentService: PaymentService;
  let paymentRepository: PaymentRepository;

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
            validateChainId: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
    paymentRepository = moduleRef.get(PaymentRepository);

    const stripeCustomersCreateMock = jest.fn();
    const stripePaymentIntentsCreateMock = jest.fn();
    const stripePaymentIntentsRetrieveMock = jest.fn();

    stripe = {
      customers: {
        create: stripeCustomersCreateMock,
      },
      paymentIntents: {
        create: stripePaymentIntentsCreateMock,
        retrieve: stripePaymentIntentsRetrieveMock
      },
    } as any;

    paymentService['stripe'] = stripe;

    jest
      .spyOn(stripe.customers, 'create')
      .mockImplementation(stripeCustomersCreateMock);
    jest
      .spyOn(stripe.paymentIntents, 'create')
      .mockImplementation(stripePaymentIntentsCreateMock);
    jest
      .spyOn(stripe.paymentIntents, 'retrieve')
      .mockImplementation(stripePaymentIntentsRetrieveMock);
  });
  
  describe('createFiatPayment', () => {
    let createPaymentIntentMock: any, findOneMock: any, createPaymentMock: any;

    beforeEach(() => {
      findOneMock = jest.spyOn(paymentRepository, 'findOne');
      createPaymentIntentMock = jest.spyOn(stripe.paymentIntents, 'create');
    });

    afterEach(() => {
      expect(createPaymentIntentMock).toHaveBeenCalledTimes(1);
      createPaymentIntentMock.mockRestore();
    });

    it('should create a fiat payment successfully', async () => {
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      const userId = 1;

      const paymentIntent = {
        client_secret: 'clientSecret123',
      };

      createPaymentIntentMock.mockResolvedValue(paymentIntent);
      findOneMock.mockResolvedValue(null);
      
      const result = await paymentService.createFiatPayment(userId, dto);

      expect(createPaymentIntentMock).toHaveBeenCalledWith({
        amount: dto.amount * 100,
        currency: dto.currency,
      });
      expect(result).toEqual(paymentIntent.client_secret);
    });

    it('should throw a bad request exception if transaction already exist', async () => {0
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      const userId = 1;

      const paymentIntent = {
        client_secret: 'clientSecret123',
      };

      createPaymentIntentMock.mockResolvedValue(paymentIntent);
      findOneMock.mockResolvedValue({ transaction: paymentIntent.client_secret } as PaymentEntity);

      await expect(
        paymentService.createFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.TransactionAlreadyExists);
    });

    it('should throw a bad request exception if the payment intent creation fails', async () => {0
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      const userId = 1;

      createPaymentIntentMock.mockRejectedValue(new Error());

      await expect(
        paymentService.createFiatPayment(userId, dto),
      ).rejects.toThrowError();
    });
  });

  describe('confirmFiatPayment', () => {
    let retrievePaymentIntentMock: any;

    beforeEach(() => {
      retrievePaymentIntentMock = jest.spyOn(stripe.paymentIntents, 'retrieve');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should confirm a fiat payment successfully', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      const paymentData = {
        status: 'succeeded',
        amount: 100,
        currency: Currency.EUR,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      const result = await paymentService.confirmFiatPayment(userId, dto);

      expect(result).toBe(true);
    });

    it('should handle payment cancellation', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      const paymentData = {
        status: StripePaymentStatus.CANCELED,
        amount: 100,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.NotSuccess);
    });

    it('should handle payment requiring a payment method', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      const paymentData = {
        status: StripePaymentStatus.REQUIRES_PAYMENT_METHOD,
        amount: 100,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.NotSuccess);
    });

    it('should handle payment status other than succeeded', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      const paymentData = {
        status: 'unknown_status',
        amount: 100,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      const result = await paymentService.confirmFiatPayment(userId, dto);

      expect(result).toBe(false);
    });

    it('should return false if the payment is not found', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      retrievePaymentIntentMock.mockResolvedValue(null);

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.NotFound);
    });
  });

  describe('createCryptoPayment', () => {
    let jsonRpcProviderMock: any, findOneMock: any, createPaymentMock: any;

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

      jest
        .spyOn(HMToken__factory, 'connect')
        .mockReturnValue(mockTokenContract);
      jest.spyOn(mockTokenContract, 'symbol');
      findOneMock = jest.spyOn(paymentRepository, 'findOne');
      createPaymentMock = jest.spyOn(paymentRepository, 'create');
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
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      mockTokenContract.symbol.mockResolvedValue(token);
      findOneMock.mockResolvedValue(null);
      createPaymentMock.mockResolvedValue(true);

      const result = await paymentService.createCryptoPayment(userId, dto);

      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        transaction: dto.transactionHash,
      });
      expect(paymentRepository.create).toHaveBeenCalledWith({
        userId,
        source: PaymentSource.CRYPTO,
        type: PaymentType.DEPOSIT,
        currency: TokenId.HMT,
        amount: '100',
        rate: 0.5,
        transaction: MOCK_TRANSACTION_HASH,
        chainId: ChainId.LOCALHOST,
        status: PaymentStatus.SUCCEEDED,
      });
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
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

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

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

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
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD - 1,
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

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
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: TX_CONFIRMATION_TRESHOLD,
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      mockTokenContract.symbol.mockResolvedValue(token);

      findOneMock.mockResolvedValue({} as any);

      await expect(
        paymentService.createCryptoPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.TransactionAlreadyExists);
    });
  });

  describe('getUserBalance', () => {
    it('should return the correct balance for a user', async () => {
      const userId = 1;
      const expectedBalance = ethers.utils.parseUnits('20', 'ether');

      paymentRepository.find = jest.fn().mockResolvedValue([
        {
          amount: ethers.utils.parseUnits('50', 'ether'),
          rate: 1,
          type: PaymentType.DEPOSIT,
        },
        {
          amount: ethers.utils.parseUnits('150', 'ether'),
          rate: 1,
          type: PaymentType.DEPOSIT,
        },
        {
          amount: ethers.utils.parseUnits('180', 'ether'),
          rate: 1,
          type: PaymentType.WITHDRAWAL,
        },
      ]);

      const balance = await paymentService.getUserBalance(userId);

      expect(balance).toEqual(expectedBalance);
      expect(paymentRepository.find).toHaveBeenCalledWith({ userId });
    });

    it('should return 0 balance for a user with no payment entities', async () => {
      const userId = 1;
      paymentRepository.find = jest.fn().mockResolvedValue([]);

      const balance = await paymentService.getUserBalance(userId);

      expect(balance).toEqual(BigNumber.from(0));
      expect(paymentRepository.find).toHaveBeenCalledWith({ userId });
    });
  });
});
