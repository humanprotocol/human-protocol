import { ethers } from 'ethers';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import {
  ErrorPayment,
  ErrorPostgres,
  ErrorSignature,
} from '../../common/constants/errors';
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
  MOCK_SIGNATURE,
  MOCK_TRANSACTION_HASH,
} from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { PaymentEntity } from './payment.entity';
import { verifySignature } from '../../common/utils/signature';
import { ConflictException } from '@nestjs/common';
import { DatabaseError } from '../../database/database.error';
import { StripeConfigService } from '../../common/config/stripe-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

jest.mock('@human-protocol/sdk');

jest.mock('../../common/utils', () => ({
  getRate: jest.fn().mockImplementation(() => 1.5),
}));

jest.mock('../../common/utils/signature', () => ({
  verifySignature: jest.fn().mockReturnValue(true),
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
          case 'RPC_URL_POLYGON_AMOY':
            return 'http://0.0.0.0:8545';
          default:
            return defaultValue;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        StripeConfigService,
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
        NetworkConfigService,
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
        retrieve: stripePaymentIntentsRetrieveMock,
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
    let createPaymentIntentMock: any, findOneMock: any;

    beforeEach(() => {
      findOneMock = jest.spyOn(paymentRepository, 'findOneByTransaction');
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

    it('should throw a bad request exception if transaction already exist', async () => {
      0;
      const dto = {
        amount: 100,
        currency: Currency.USD,
      };

      const userId = 1;

      const paymentIntent = {
        client_secret: 'clientSecret123',
      };

      createPaymentIntentMock.mockResolvedValue(paymentIntent);
      findOneMock.mockResolvedValue({
        transaction: paymentIntent.client_secret,
      } as PaymentEntity);

      await expect(
        paymentService.createFiatPayment(userId, dto),
      ).rejects.toThrowError(ErrorPayment.TransactionAlreadyExists);
    });

    it('should throw a bad request exception if the payment intent creation fails', async () => {
      0;
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
    let retrievePaymentIntentMock: any, findOneMock: any;

    beforeEach(() => {
      findOneMock = jest.spyOn(paymentRepository, 'findOneByTransaction');
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
        status: StripePaymentStatus.SUCCEEDED,
        amount: 100,
        amount_received: 100,
        currency: Currency.USD,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      const paymentEntity: Partial<PaymentEntity> = {
        userId: userId,
        status: PaymentStatus.PENDING,
        amount: 1,
        currency: Currency.USD,
      };
      findOneMock.mockResolvedValue(paymentEntity);

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
        amount_received: 0,
        currency: Currency.USD,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      const paymentEntity: Partial<PaymentEntity> = {
        userId: userId,
        status: PaymentStatus.PENDING,
        amount: 0,
        currency: Currency.USD,
      };
      findOneMock.mockResolvedValue(paymentEntity);

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
        amount_received: 0,
        currency: Currency.USD,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      const paymentEntity: Partial<PaymentEntity> = {
        userId: userId,
        status: PaymentStatus.PENDING,
        amount: 0,
        currency: Currency.USD,
      };
      findOneMock.mockResolvedValue(paymentEntity);

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
        amount_received: 0,
        currency: Currency.USD,
      };

      retrievePaymentIntentMock.mockResolvedValue(paymentData);

      const paymentEntity: Partial<PaymentEntity> = {
        userId: userId,
        status: PaymentStatus.PENDING,
        amount: 0,
        currency: Currency.USD,
      };
      findOneMock.mockResolvedValue(paymentEntity);

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
      interface: {
        parseLog: jest.fn().mockReturnValue({ args: { _to: MOCK_ADDRESS } }),
      },
    };

    beforeEach(() => {
      jsonRpcProviderMock = {
        getTransactionReceipt: jest.fn(),
      };

      jest
        .spyOn(ethers, 'JsonRpcProvider')
        .mockReturnValue(jsonRpcProviderMock as any);

      jest
        .spyOn(HMToken__factory, 'connect')
        .mockReturnValue(mockTokenContract);
      jest.spyOn(mockTokenContract, 'symbol');
      findOneMock = jest.spyOn(paymentRepository, 'findOneByTransaction');
      createPaymentMock = jest.spyOn(paymentRepository, 'createUnique');
    });

    afterEach(() => {
      jest.restoreAllMocks();
      (verifySignature as jest.Mock).mockRestore();
    });

    it('should create a crypto payment successfully', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.POLYGON_AMOY,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const token = 'hmt';

      const transactionReceipt = {
        from: MOCK_ADDRESS,
        logs: [
          {
            data: ethers.parseUnits('10').toString(),
            blockNumber: 123,
            blockHash: '123',
            transactionIndex: 123,
            removed: false,
            address: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress as string,
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        hash: MOCK_TRANSACTION_HASH,
        confirmations: jest.fn().mockResolvedValue(TX_CONFIRMATION_TRESHOLD),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      mockTokenContract.symbol.mockResolvedValue(token);
      findOneMock.mockResolvedValue(null);
      createPaymentMock.mockResolvedValue(true);

      const result = await paymentService.createCryptoPayment(
        userId,
        dto,
        MOCK_SIGNATURE,
      );

      expect(paymentRepository.findOneByTransaction).toHaveBeenCalledWith(
        dto.transactionHash,
        dto.chainId,
      );
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId,
        source: PaymentSource.CRYPTO,
        type: PaymentType.DEPOSIT,
        currency: TokenId.HMT,
        amount: 10,
        rate: 1.5,
        transaction: MOCK_TRANSACTION_HASH,
        chainId: ChainId.POLYGON_AMOY,
        status: PaymentStatus.SUCCEEDED,
      });
      expect(result).toBe(true);
    });

    it('should throw a conflict exception if the token address is unsupported', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.POLYGON_AMOY,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const token = 'hmt';

      const transactionReceipt = {
        from: MOCK_ADDRESS,
        logs: [
          {
            data: ethers.parseUnits('10').toString(),
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
        confirmations: jest.fn().mockResolvedValue(TX_CONFIRMATION_TRESHOLD),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      mockTokenContract.symbol.mockResolvedValue(token);

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrowError(ErrorPayment.UnsupportedToken);
    });

    it('should throw a conflict exception if an unsupported token is used', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.POLYGON_AMOY,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const unsupportedToken = 'doge';

      const transactionReceipt = {
        from: MOCK_ADDRESS,
        logs: [
          {
            data: ethers.parseUnits('10').toString(),
            blockNumber: 123,
            blockHash: '123',
            transactionIndex: 123,
            removed: false,
            address: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress as string,
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: jest.fn().mockResolvedValue(TX_CONFIRMATION_TRESHOLD),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      mockTokenContract.symbol.mockResolvedValue(unsupportedToken);

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrowError(ErrorPayment.UnsupportedToken);
    });

    it('should throw a signature error if the signature is wrong', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.POLYGON_AMOY,
        transactionHash: MOCK_TRANSACTION_HASH,
      };
      (verifySignature as jest.Mock).mockImplementation(() => {
        throw new ConflictException(ErrorSignature.SignatureNotVerified);
      });

      const transactionReceipt = {
        from: MOCK_ADDRESS,
        logs: [],
        confirmations: jest.fn().mockResolvedValue(TX_CONFIRMATION_TRESHOLD),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrowError(ErrorSignature.SignatureNotVerified);
    });

    it('should throw a not found exception if the transaction is not found by hash', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.POLYGON_AMOY,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(null);

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrowError(ErrorPayment.TransactionNotFoundByHash);
    });

    it('should throw a not found exception if the transaction data is invalid', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.LOCALHOST,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const transactionReceipt = {
        from: MOCK_ADDRESS,
        logs: [],
        confirmations: jest.fn().mockResolvedValue(TX_CONFIRMATION_TRESHOLD),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrowError(ErrorPayment.InvalidTransactionData);
    });

    it('should throw a not found exception if the transaction has insufficient confirmations', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.POLYGON_AMOY,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const transactionReceipt = {
        from: MOCK_ADDRESS,
        logs: [
          {
            data: ethers.parseUnits('10').toString(),
            blockNumber: 123,
            blockHash: '123',
            transactionIndex: 123,
            removed: false,
            address: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress as string,
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: jest
          .fn()
          .mockResolvedValue(TX_CONFIRMATION_TRESHOLD - 1),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrowError(
        ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
      );
    });

    it('should throw a bad request exception if the payment with the same transaction hash already exists', async () => {
      const userId = 1;
      const dto = {
        chainId: ChainId.POLYGON_AMOY,
        transactionHash: MOCK_TRANSACTION_HASH,
      };

      const token = 'hmt';

      const transactionReceipt = {
        from: MOCK_ADDRESS,
        logs: [
          {
            data: ethers.parseUnits('10').toString(),
            blockNumber: 123,
            blockHash: '123',
            transactionIndex: 123,
            removed: false,
            address: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress as string,
            topics: ['0x123', '0x0000000000000000000000000123', MOCK_ADDRESS],
            transactionHash: MOCK_TRANSACTION_HASH,
            logIndex: 123,
          },
        ],
        transactionHash: MOCK_TRANSACTION_HASH,
        confirmations: jest.fn().mockResolvedValue(TX_CONFIRMATION_TRESHOLD),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      mockTokenContract.symbol.mockResolvedValue(token);

      findOneMock.mockResolvedValue({} as any);

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrowError(ErrorPayment.TransactionAlreadyExists);
    });
  });

  describe('getUserBalance', () => {
    it('should return the correct balance for a user', async () => {
      const userId = 1;
      const expectedBalance = 20;

      paymentRepository.findByUserAndStatus = jest.fn().mockResolvedValue([
        {
          amount: 50,
          rate: 1,
          type: PaymentType.DEPOSIT,
          status: PaymentStatus.SUCCEEDED,
        },
        {
          amount: 150,
          rate: 1,
          type: PaymentType.DEPOSIT,
          status: PaymentStatus.SUCCEEDED,
        },
        {
          amount: -180,
          rate: 1,
          type: PaymentType.WITHDRAWAL,
          status: PaymentStatus.SUCCEEDED,
        },
      ]);

      const balance = await paymentService.getUserBalance(userId);

      expect(balance).toEqual(expectedBalance);
      expect(paymentRepository.findByUserAndStatus).toHaveBeenCalledWith(
        userId,
        PaymentStatus.SUCCEEDED,
      );
    });

    it('should return 0 balance for a user with no payment entities', async () => {
      const userId = 1;
      paymentRepository.findByUserAndStatus = jest.fn().mockResolvedValue([]);

      const balance = await paymentService.getUserBalance(userId);

      expect(balance).toEqual(0);
      expect(paymentRepository.findByUserAndStatus).toHaveBeenCalledWith(
        userId,
        PaymentStatus.SUCCEEDED,
      );
    });
  });

  describe('createRefundPayment', () => {
    const mockPaymentRefundCreateDto = {
      userId: 1,
      jobId: 2,
      refundAmount: 100,
    };

    it('should successfully create a refund payment', async () => {
      jest
        .spyOn(paymentRepository, 'createUnique')
        .mockResolvedValueOnce(undefined as any);

      await expect(
        paymentService.createRefundPayment(mockPaymentRefundCreateDto),
      ).resolves.not.toThrow();
    });

    it('should throw IncorrectAmount error when overflow occurs', async () => {
      const mockError = new DatabaseError(
        ErrorPostgres.NumericFieldOverflow.toLowerCase(),
        '',
      );
      jest
        .spyOn(paymentRepository, 'createUnique')
        .mockRejectedValueOnce(mockError);

      await expect(
        paymentService.createRefundPayment(mockPaymentRefundCreateDto),
      ).rejects.toThrow(DatabaseError);
    });

    it('should throw NotSuccess error on other database errors', async () => {
      jest
        .spyOn(paymentRepository, 'createUnique')
        .mockRejectedValueOnce(new DatabaseError('', ''));

      await expect(
        paymentService.createRefundPayment(mockPaymentRefundCreateDto),
      ).rejects.toThrow(DatabaseError);
    });
  });
});
