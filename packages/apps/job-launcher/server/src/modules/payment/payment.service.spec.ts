jest.mock('@human-protocol/sdk');
jest.mock('../../common/utils/signature', () => ({
  verifySignature: jest.fn().mockReturnValue(true),
}));

import { faker } from '@faker-js/faker/.';
import { createMock } from '@golevelup/ts-jest';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';
import {
  MOCK_ADDRESS,
  MOCK_PAYMENT_ID,
  MOCK_SIGNATURE,
  MOCK_TRANSACTION_HASH,
  mockConfig,
} from '../../../test/constants';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';
import {
  ErrorPayment,
  ErrorPostgres,
  ErrorSignature,
} from '../../common/constants/errors';
import { SortDirection } from '../../common/enums/collection';
import {
  PaymentCurrency,
  PaymentSortField,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  VatType,
} from '../../common/enums/payment';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ServerError,
} from '../../common/errors';
import { verifySignature } from '../../common/utils/signature';
import { JobRepository } from '../job/job.repository';
import { RateService } from '../rate/rate.service';
import { UserRepository } from '../user/user.repository';
import { Web3Service } from '../web3/web3.service';
import { GetPaymentsDto, UserBalanceDto } from './payment.dto';
import { PaymentEntity } from './payment.entity';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PaymentProvider } from './providers/payment-provider.abstract';
import { Invoice, PaymentData } from './payment.interface';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let paymentProvider: jest.Mocked<PaymentProvider>;
  let paymentRepository: jest.Mocked<PaymentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let rateService: jest.Mocked<RateService>;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: ChainId.LOCALHOST }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        {
          provide: PaymentRepository,
          useValue: createMock<PaymentRepository>(),
        },
        {
          provide: UserRepository,
          useValue: createMock<UserRepository>(),
        },
        {
          provide: JobRepository,
          useValue: createMock<JobRepository>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn(),
          },
        },
        { provide: HttpService, useValue: createMock<HttpService>() },
        {
          provide: RateService,
          useValue: {
            getRate: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: PaymentProvider,
          useValue: createMock<PaymentProvider>(),
        },
        NetworkConfigService,
        ServerConfigService,
      ],
    }).compile();

    paymentService = moduleRef.get<PaymentService>(PaymentService);
    paymentProvider = moduleRef.get(PaymentProvider);
    paymentRepository = moduleRef.get(PaymentRepository);
    userRepository = moduleRef.get(UserRepository);
    rateService = moduleRef.get(RateService);
  });

  describe('createFiatPayment', () => {
    let findOneMock: any;

    beforeEach(() => {
      findOneMock = jest.spyOn(paymentRepository, 'findOneByTransaction');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a fiat payment successfully', async () => {
      const dto = {
        amount: 100,
        currency: PaymentCurrency.USD,
        paymentMethodId: 'pm_123',
      };

      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      const paymentIntent = {
        id: 'pi_123',
        clientSecret: 'clientSecret123',
      } as PaymentData;

      const invoice = {
        id: 'id',
        paymentId: paymentIntent.id,
      } as Invoice;

      paymentProvider.createInvoice.mockResolvedValue(invoice as any);
      paymentProvider.assignPaymentMethod.mockResolvedValue(
        paymentIntent as any,
      );

      jest
        .spyOn(paymentRepository, 'findOneByTransaction')
        .mockResolvedValue(null);

      jest
        .spyOn(paymentRepository, 'createUnique')
        .mockResolvedValue(undefined as any);

      const result = await paymentService.createFiatPayment(user as any, dto);

      expect(result).toEqual(paymentIntent.clientSecret);
      expect(paymentProvider.createInvoice).toHaveBeenCalledWith(
        'cus_123',
        10000,
        PaymentCurrency.USD,
        'Top up',
      );
      expect(paymentProvider.assignPaymentMethod).toHaveBeenCalledWith(
        'pi_123',
        'pm_123',
        false,
      );
    });

    it('should throw a bad request exception if transaction already exist', async () => {
      const dto = {
        amount: 100,
        currency: PaymentCurrency.USD,
        paymentMethodId: 'pm_123',
      };

      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      const paymentIntent = {
        id: 'pi_123',
        client_secret: 'clientSecret123',
      };

      const invoice = {
        id: 'id',
        payment_intent: paymentIntent.id,
      };

      paymentProvider.createInvoice.mockResolvedValue(invoice as any);
      paymentProvider.assignPaymentMethod.mockResolvedValue(
        paymentIntent as any,
      );

      findOneMock.mockResolvedValue({
        transaction: paymentIntent.client_secret,
      } as PaymentEntity);

      await expect(
        paymentService.createFiatPayment(user as any, dto),
      ).rejects.toThrow(
        new ConflictError(ErrorPayment.TransactionAlreadyExists),
      );
    });
  });

  describe('confirmFiatPayment', () => {
    let findOneMock: any;

    beforeEach(() => {
      findOneMock = jest.spyOn(paymentRepository, 'findOneByTransaction');
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
        status: PaymentStatus.SUCCEEDED,
        amount: 100,
        amountReceived: 100,
        currency: PaymentCurrency.USD,
      };

      paymentProvider.retrievePaymentIntent.mockResolvedValue(
        paymentData as any,
      );

      const paymentEntity: Partial<PaymentEntity> = {
        userId: userId,
        status: PaymentStatus.PENDING,
        amount: 1,
        currency: PaymentCurrency.USD,
      };
      findOneMock.mockResolvedValue(paymentEntity);

      const result = await paymentService.confirmFiatPayment(userId, dto);

      expect(result).toBe(true);
      expect(paymentProvider.retrievePaymentIntent).toHaveBeenCalledWith(
        MOCK_PAYMENT_ID,
      );
      expect(paymentRepository.updateOne).toHaveBeenCalledWith({
        userId,
        amount: 1,
        currency: PaymentCurrency.USD,
        status: PaymentStatus.SUCCEEDED,
      });
    });

    it('should throw a not found exception if payment not found', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      findOneMock.mockResolvedValue(null);

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrow(new NotFoundError(ErrorPayment.NotFound));
    });

    it('should throw a conflict exception if payment status is not pending', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      const paymentData = {
        status: PaymentStatus.FAILED,
        amount: 100,
        amountReceived: 0,
        currency: PaymentCurrency.USD,
      };

      paymentProvider.retrievePaymentIntent.mockResolvedValue(
        paymentData as any,
      );

      const paymentEntity: Partial<PaymentEntity> = {
        userId: userId,
        status: PaymentStatus.PENDING,
        amount: 0,
        currency: PaymentCurrency.USD,
      };
      findOneMock.mockResolvedValue(paymentEntity);

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrow(new ConflictError(ErrorPayment.NotSuccess));
    });

    it('should handle payment status other than succeeded', async () => {
      const userId = 1;
      const dto = {
        paymentId: MOCK_PAYMENT_ID,
      };

      const paymentData = {
        status: 'unknown_status',
        amount: 100,
        amountReceived: 0,
        currency: PaymentCurrency.USD,
      };

      paymentProvider.retrievePaymentIntent.mockResolvedValue(
        paymentData as any,
      );

      const paymentEntity: Partial<PaymentEntity> = {
        userId: userId,
        status: PaymentStatus.PENDING,
        amount: 0,
        currency: PaymentCurrency.USD,
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

      paymentProvider.retrievePaymentIntent.mockResolvedValue(
        null as unknown as PaymentData,
      );

      await expect(
        paymentService.confirmFiatPayment(userId, dto),
      ).rejects.toThrow(new NotFoundError(ErrorPayment.NotFound));
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

      mockTokenContract.symbol.mockResolvedValue(PaymentCurrency.HMT);
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
        currency: PaymentCurrency.HMT,
        amount: 10,
        rate: 1,
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
      ).rejects.toThrow(new ConflictError(ErrorPayment.UnsupportedToken));
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
      ).rejects.toThrow(new ConflictError(ErrorPayment.UnsupportedToken));
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
      ).rejects.toThrow(new ConflictError(ErrorSignature.SignatureNotVerified));
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
      ).rejects.toThrow(
        new NotFoundError(ErrorPayment.TransactionNotFoundByHash),
      );
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
      ).rejects.toThrow(new ServerError(ErrorPayment.InvalidTransactionData));
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
      ).rejects.toThrow(
        new ConflictError(
          ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
        ),
      );
    });

    it('should throw a bad request exception if the payment with the same transaction hash already exists', async () => {
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
        confirmations: jest.fn().mockResolvedValue(TX_CONFIRMATION_TRESHOLD),
      };

      jsonRpcProviderMock.getTransactionReceipt.mockResolvedValue(
        transactionReceipt,
      );

      mockTokenContract.symbol.mockResolvedValue(PaymentCurrency.HMT);

      findOneMock.mockResolvedValue({} as any);

      await expect(
        paymentService.createCryptoPayment(userId, dto, MOCK_SIGNATURE),
      ).rejects.toThrow(
        new ConflictError(ErrorPayment.TransactionAlreadyExists),
      );
    });
  });

  describe('convertToUSD', () => {
    it('should convert the given amount to USD correctly', async () => {
      const amount = 100;
      const currency = PaymentCurrency.HMT;
      const rate = 0.5;

      jest.spyOn(rateService, 'getRate').mockResolvedValue(rate);

      const result = await paymentService.convertToUSD(amount, currency);

      expect(result).toEqual(amount * rate);
      expect(rateService.getRate).toHaveBeenCalledWith(
        currency,
        PaymentCurrency.USD,
      );
    });

    it('should return the same amount if the currency is already USD', async () => {
      const amount = 100;
      const currency = PaymentCurrency.USD;

      const result = await paymentService.convertToUSD(amount, currency);

      expect(result).toEqual(amount);
      expect(rateService.getRate).not.toHaveBeenCalled();
    });
  });

  describe('createRefundPayment', () => {
    const mockPaymentRefundCreateDto = {
      userId: 1,
      jobId: 2,
      refundAmount: 100,
      refundCurrency: PaymentCurrency.HMT,
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
      ).rejects.toThrow(mockError);
    });

    it('should throw NotSuccess error on other database errors', async () => {
      jest
        .spyOn(paymentRepository, 'createUnique')
        .mockRejectedValueOnce(new DatabaseError('', ''));

      await expect(
        paymentService.createRefundPayment(mockPaymentRefundCreateDto),
      ).rejects.toThrow(new DatabaseError('', ''));
    });
  });

  describe('createCustomerAndAssignCard', () => {
    it('should create a customer and assign a card successfully', async () => {
      const user = {
        id: 1,
        email: 'test@hmt.ai',
        paymentProviderId: null,
      };

      const client_secret = 'clientSecret123';
      const customerId = 'cus_123';

      paymentProvider.createCustomer.mockResolvedValue(customerId);
      paymentProvider.setupCard.mockResolvedValue(client_secret);

      const result = await paymentService.createCustomerAndAssignCard(
        user as any,
      );

      expect(result).toEqual(client_secret);
      expect(paymentProvider.createCustomer).toHaveBeenCalledWith(user.email);
    });

    it('should throw a bad request exception if the customer creation fails', async () => {
      const user = {
        id: 1,
        email: 'test@hmt.ai',
        paymentProviderId: undefined,
      };

      paymentProvider.createCustomer.mockRejectedValue(
        new ServerError(ErrorPayment.CustomerNotCreated),
      );

      await expect(
        paymentService.createCustomerAndAssignCard(user as any),
      ).rejects.toThrow(new ServerError(ErrorPayment.CustomerNotCreated));
    });

    it('should throw a bad request exception if the setup intent creation fails', async () => {
      const user = {
        id: 1,
        email: 'test@hmt.ai',
      };

      paymentProvider.createCustomer.mockResolvedValue('cus_123');
      paymentProvider.setupCard.mockRejectedValue(
        new ServerError(ErrorPayment.CardNotAssigned),
      );

      await expect(
        paymentService.createCustomerAndAssignCard(user as any),
      ).rejects.toThrow(new ServerError(ErrorPayment.CardNotAssigned));

      expect(paymentProvider.createCustomer).toHaveBeenCalledWith(user.email);
    });

    it('should throw a bad request exception if the client secret does not exists', async () => {
      const user = {
        id: 1,
        email: 'test@hmt.ai',
      };

      paymentProvider.createCustomer.mockResolvedValue('cus_123');
      paymentProvider.setupCard.mockRejectedValue(
        new ServerError(ErrorPayment.ClientSecretDoesNotExist),
      );

      await expect(
        paymentService.createCustomerAndAssignCard(user as any),
      ).rejects.toThrow(new ServerError(ErrorPayment.ClientSecretDoesNotExist));
    });
  });

  describe('confirmCard', () => {
    it('should confirm a card and update user paymentProviderId successfully', async () => {
      const user = {
        id: 1,
        email: 'test@hmt.ai',
        paymentProviderId: null,
      };

      const setupMock = {
        customerId: 'cus_123',
        paymentMethod: 'pm_123',
      };

      paymentProvider.retrieveCardSetup.mockResolvedValue(setupMock as any);
      paymentProvider.updateCustomer.mockResolvedValue(null as any);
      jest
        .spyOn(userRepository, 'updateOne')
        .mockResolvedValue(undefined as any);

      const result = await paymentService.confirmCard(user as any, {
        setupId: 'setup_123',
        defaultCard: false,
      });

      expect(result).toBeTruthy();
      expect(userRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentProviderId: 'cus_123',
        }),
      );
      expect(paymentProvider.retrieveCardSetup).toHaveBeenCalledWith(
        'setup_123',
      );
      expect(paymentProvider.updateCustomer).toHaveBeenCalledWith('cus_123', {
        defaultPaymentMethod: 'pm_123',
      });
    });

    it('should fail if setupId is not in Stripe', async () => {
      const user = {
        id: 1,
        email: 'test@hmt.ai',
      };

      paymentProvider.retrieveCardSetup.mockResolvedValue(undefined as any);

      await expect(
        paymentService.confirmCard(user as any, {
          setupId: '1',
          defaultCard: false,
        }),
      ).rejects.toThrow(new ServerError(ErrorPayment.SetupNotFound));
    });
  });

  describe('createSlash', () => {
    const user = {
      id: faker.number.int(),
      email: faker.internet.email(),
      paymentProviderId: faker.word.sample(),
    };

    const jobEntity = {
      id: faker.number.int(),
      user: user,
      userId: user.id,
    };

    const paymentIntent = {
      id: faker.word.sample(),
      client_secret: faker.word.sample(),
    };

    const invoiceId = faker.word.sample();
    const paymentMethodId = faker.word.sample();

    it('should create slash successfully', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(user as any);

      paymentProvider.createInvoice.mockResolvedValueOnce({
        id: invoiceId,
        paymentId: paymentIntent,
      } as any);
      paymentProvider.assignPaymentMethod.mockResolvedValueOnce(
        paymentIntent as any,
      );
      paymentProvider.getDefaultPaymentMethod.mockResolvedValueOnce(
        paymentMethodId,
      );

      const result = await paymentService.createSlash(jobEntity as any);

      expect(result).toBe(undefined);
      expect(paymentProvider.createInvoice).toHaveBeenCalledWith(
        user.paymentProviderId,
        expect.any(Number),
        PaymentCurrency.USD,
        'Slash Job Id ' + jobEntity.id,
      );
      expect(paymentProvider.assignPaymentMethod).toHaveBeenCalledWith(
        paymentIntent,
        paymentMethodId,
        true,
      );
    });

    it('should fail if user does not have payment info', async () => {
      jest
        .spyOn(userRepository, 'findById')
        .mockResolvedValueOnce(undefined as any);

      await expect(
        paymentService.createSlash(jobEntity as any),
      ).rejects.toThrow(ErrorPayment.CustomerNotFound);
    });

    it('should fail if stripe create payment intent fails', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(user as any);

      paymentProvider.createInvoice.mockResolvedValueOnce({
        id: invoiceId,
      } as any);
      paymentProvider.getDefaultPaymentMethod.mockResolvedValueOnce(
        paymentMethodId,
      );

      paymentProvider.assignPaymentMethod.mockRejectedValue(
        new ServerError(ErrorPayment.PaymentMethodAssociationFailed),
      );

      await expect(
        paymentService.createSlash(jobEntity as any),
      ).rejects.toThrow(
        new ServerError(ErrorPayment.PaymentMethodAssociationFailed),
      );
    });
  });

  describe('listUserPaymentMethods', () => {
    it('should list user payment methods successfully', async () => {
      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      const paymentMethods = [
        {
          id: 'pm_123',
          brand: 'visa',
          last4: '4242',
        },
        { id: 'pm_456', brand: 'mastercard', last4: '5555' },
      ];

      paymentProvider.listPaymentMethods.mockResolvedValue(
        paymentMethods as any,
      );
      paymentProvider.getDefaultPaymentMethod.mockResolvedValue('pm_123');

      const result = await paymentService.listUserPaymentMethods(user as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        default: true,
      });
      expect(result[1]).toEqual({
        id: 'pm_456',
        brand: 'mastercard',
        last4: '5555',
        default: false,
      });
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete a payment method successfully', async () => {
      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      paymentProvider.retrievePaymentMethod.mockResolvedValue({
        id: 'pm_123',
      } as any);
      paymentProvider.getDefaultPaymentMethod.mockResolvedValue('pm_456');
      jest
        .spyOn(paymentService as any, 'isPaymentMethodInUse')
        .mockResolvedValue(false);
      paymentProvider.detachPaymentMethod.mockResolvedValue({} as any);

      await paymentService.deletePaymentMethod(user as any, 'pm_123');

      expect(paymentProvider.detachPaymentMethod).toHaveBeenCalledWith(
        'pm_123',
      );
    });

    it('should throw an error when trying to delete the default payment method in use', async () => {
      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      paymentProvider.retrievePaymentMethod.mockResolvedValue({
        id: 'pm_123',
        default: true,
      } as any);
      paymentProvider.getDefaultPaymentMethod.mockResolvedValue('pm_123');
      jest
        .spyOn(paymentService as any, 'isPaymentMethodInUse')
        .mockResolvedValue(true);

      await expect(
        paymentService.deletePaymentMethod(user as any, 'pm_123'),
      ).rejects.toThrow(new ConflictError(ErrorPayment.PaymentMethodInUse));
    });
  });

  describe('getUserBillingInfo', () => {
    it('should get user billing info successfully', async () => {
      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      const customer = {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          country: 'de',
          postalCode: '12345',
          city: 'Berlin',
          line: 'Street 1',
        },
      };

      paymentProvider.retrieveBillingInfo.mockResolvedValue(customer as any);

      const result = await paymentService.getUserBillingInfo(user as any);

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          country: 'de',
          postalCode: '12345',
          city: 'Berlin',
          line: 'Street 1',
        },
      });
    });
  });

  describe('updateUserBillingInfo', () => {
    it('should update user billing info successfully', async () => {
      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      const updateBillingInfoDto = {
        name: 'John Doe',
        email: 'john@example.com',
        vat: 'DE123456789',
        vatType: VatType.EU_VAT,
        address: {
          country: 'DE',
          postalCode: '12345',
          city: 'Berlin',
          line: 'Street 1',
        },
      };

      paymentProvider.updateCustomer.mockResolvedValue({} as any);

      await paymentService.updateUserBillingInfo(
        user as any,
        updateBillingInfoDto,
      );

      expect(paymentProvider.updateBillingInfo).toHaveBeenCalledWith(
        'cus_123',
        {
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            country: 'DE',
            postalCode: '12345',
            city: 'Berlin',
            line: 'Street 1',
          },
          vat: 'DE123456789',
          vatType: VatType.EU_VAT,
        },
      );
    });
  });

  describe('changeDefaultPaymentMethod', () => {
    it('should change the default payment method successfully', async () => {
      const user = {
        id: 1,
        paymentProviderId: 'cus_123',
      };

      paymentProvider.updateCustomer.mockResolvedValue({} as any);

      await paymentService.changeDefaultPaymentMethod(user as any, 'pm_123');

      expect(paymentProvider.updateCustomer).toHaveBeenCalledWith('cus_123', {
        defaultPaymentMethod: 'pm_123',
      });
    });
  });

  describe('getAllPayments', () => {
    let fetchFilteredMock: jest.SpyInstance;

    beforeEach(() => {
      fetchFilteredMock = jest.spyOn(paymentRepository, 'fetchFiltered');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should retrieve and map all payments successfully', async () => {
      const userId = 1;
      const dto: GetPaymentsDto = {
        page: 0,
        pageSize: 10,
        sortField: PaymentSortField.CREATED_AT,
        sort: SortDirection.DESC,
        skip: 10,
      };

      const mockEntities = [
        {
          amount: 100,
          rate: 1,
          currency: 'usd',
          type: PaymentType.DEPOSIT,
          source: PaymentSource.FIAT,
          status: PaymentStatus.SUCCEEDED,
          transaction: 'tx_123',
          createdAt: new Date('2023-10-01T00:00:00Z'),
          job: { escrowAddress: '0x123' },
        },
        {
          amount: -50,
          rate: 1,
          currency: 'usd',
          type: PaymentType.WITHDRAWAL,
          source: PaymentSource.CRYPTO,
          status: PaymentStatus.SUCCEEDED,
          transaction: 'tx_456',
          createdAt: new Date('2023-10-02T00:00:00Z'),
          job: null,
        },
      ];

      const mockResult = {
        entities: mockEntities,
        itemCount: 2,
      };

      fetchFilteredMock.mockResolvedValue(mockResult);

      const result = await paymentService.getAllPayments(dto, userId);

      const expectedPayments = [
        {
          amount: 100,
          rate: 1,
          currency: 'usd',
          type: PaymentType.DEPOSIT,
          source: PaymentSource.FIAT,
          status: PaymentStatus.SUCCEEDED,
          transaction: 'tx_123',
          createdAt: '2023-10-01T00:00:00.000Z',
          escrowAddress: '0x123',
        },
        {
          amount: -50,
          rate: 1,
          currency: 'usd',
          type: PaymentType.WITHDRAWAL,
          source: PaymentSource.CRYPTO,
          status: PaymentStatus.SUCCEEDED,
          transaction: 'tx_456',
          createdAt: '2023-10-02T00:00:00.000Z',
          escrowAddress: undefined,
        },
      ];

      expect(result).toEqual({
        page: dto.page,
        pageSize: dto.pageSize,
        results: expectedPayments,
        totalPages: 1,
        totalResults: 2,
      });

      expect(fetchFilteredMock).toHaveBeenCalledWith(dto, userId);
    });

    it('should return an empty result if no payments are found', async () => {
      const userId = 1;
      const dto: GetPaymentsDto = {
        page: 0,
        pageSize: 10,
        sortField: PaymentSortField.CREATED_AT,
        sort: SortDirection.DESC,
        skip: 10,
      };

      fetchFilteredMock.mockResolvedValue({
        entities: [],
        itemCount: 0,
      });

      const result = await paymentService.getAllPayments(dto, userId);

      expect(result).toEqual({
        page: dto.page,
        pageSize: dto.pageSize,
        results: [],
        totalPages: 0,
        totalResults: 0,
      });

      expect(fetchFilteredMock).toHaveBeenCalledWith(dto, userId);
    });

    it('should throw an error if the repository fails', async () => {
      const userId = 1;
      const dto: GetPaymentsDto = {
        page: 0,
        pageSize: 10,
        sortField: PaymentSortField.CREATED_AT,
        sort: SortDirection.DESC,
        skip: 10,
      };

      fetchFilteredMock.mockRejectedValue(new Error('Database error'));

      await expect(paymentService.getAllPayments(dto, userId)).rejects.toThrow(
        new Error('Database error'),
      );

      expect(fetchFilteredMock).toHaveBeenCalledWith(dto, userId);
    });
  });

  describe('getReceipt', () => {
    it('should get receipt successfully', async () => {
      const paymentId = 'pi_123';
      const user = { paymentProviderId: 'cus_123' } as any;

      paymentProvider.getReceiptUrl.mockResolvedValue('https://receipt.url');

      const result = await paymentService.getReceipt(paymentId, user);

      expect(result).toBe('https://receipt.url');
      expect(paymentProvider.getReceiptUrl).toHaveBeenCalledWith(
        'pi_123',
        'cus_123',
      );
    });

    it('should throw a NOT_FOUND error if receipt URL is not found', async () => {
      const paymentId = 'pi_123';
      const user = { paymentProviderId: 'cus_123' } as any;

      paymentProvider.getReceiptUrl.mockRejectedValue(
        new NotFoundError(ErrorPayment.NotFound),
      );

      await expect(paymentService.getReceipt(paymentId, user)).rejects.toThrow(
        new NotFoundError(ErrorPayment.NotFound),
      );
    });
  });

  describe('getUserBalance', () => {
    it('should return the correct balance with currency for a user', async () => {
      const userId = 1;
      const expectedBalance: UserBalanceDto = {
        balances: [
          { currency: PaymentCurrency.USD, amount: 100 },
          { currency: PaymentCurrency.HMT, amount: 50 },
          { currency: PaymentCurrency.USDT, amount: 0 },
          { currency: PaymentCurrency.USDT0, amount: 0 },
          { currency: PaymentCurrency.USDC, amount: 0 },
        ],
        totalUsdAmount: 150,
      };

      jest
        .spyOn(paymentService, 'getUserBalanceByCurrency')
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValue(0);
      jest
        .spyOn(paymentService, 'convertToUSD')
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValue(0);

      const balance = await paymentService.getUserBalance(userId);

      expect(balance).toEqual(expectedBalance);
      expect(paymentService.getUserBalanceByCurrency).toHaveBeenCalledTimes(5);
      expect(paymentService.convertToUSD).toHaveBeenCalledTimes(5);
    });

    it('should return zero balance for new users', async () => {
      const userId = 1;
      const expectedBalance: UserBalanceDto = {
        balances: [
          { currency: PaymentCurrency.USD, amount: 0 },
          { currency: PaymentCurrency.HMT, amount: 0 },
          { currency: PaymentCurrency.USDT, amount: 0 },
          { currency: PaymentCurrency.USDT0, amount: 0 },
          { currency: PaymentCurrency.USDC, amount: 0 },
        ],
        totalUsdAmount: 0,
      };

      jest
        .spyOn(paymentService, 'getUserBalanceByCurrency')
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValue(0);
      jest
        .spyOn(paymentService, 'convertToUSD')
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValue(0);

      const balance = await paymentService.getUserBalance(userId);

      expect(balance).toEqual(expectedBalance);
      expect(paymentService.getUserBalanceByCurrency).toHaveBeenCalledTimes(5);
      expect(paymentService.convertToUSD).toHaveBeenCalledTimes(5);
    });
  });

  describe('createWithdrawalPayment', () => {
    const userId = 1;
    const amount = 100;
    const currency = PaymentCurrency.USD;
    const rate = 1;

    it('should create a withdrawal payment successfully', async () => {
      jest
        .spyOn(paymentRepository, 'getUserBalancePayments')
        .mockResolvedValue([
          { amount: 100000000, currency },
        ] as PaymentEntity[]);
      jest
        .spyOn(paymentRepository, 'createUnique')
        .mockResolvedValueOnce(undefined as any);

      await expect(
        paymentService.createWithdrawalPayment(userId, amount, currency, rate),
      ).resolves.not.toThrow();

      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        amount: -amount,
        currency,
        rate,
        status: PaymentStatus.SUCCEEDED,
      });
    });

    it('should throw an error if the payment creation fails', async () => {
      jest
        .spyOn(paymentRepository, 'getUserBalancePayments')
        .mockResolvedValue([
          { amount: 100000000, currency },
        ] as PaymentEntity[]);
      jest
        .spyOn(paymentRepository, 'createUnique')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(
        paymentService.createWithdrawalPayment(userId, amount, currency, rate),
      ).rejects.toThrow('Database error');
    });

    it('should throw an error if the user does not have enough balance', async () => {
      jest
        .spyOn(paymentRepository, 'getUserBalancePayments')
        .mockResolvedValue([{ amount: 0, currency }] as PaymentEntity[]);

      await expect(
        paymentService.createWithdrawalPayment(userId, amount, currency, rate),
      ).rejects.toThrow(new ServerError(ErrorPayment.NotEnoughFunds));
    });
  });

  describe('getJobPayments', () => {
    it('should return payments filtered by jobId and type', async () => {
      const jobId = faker.number.int();
      const type = PaymentType.REFUND;
      const mockPayments = [
        {
          id: faker.number.int(),
          jobId,
          type,
          amount: faker.number.int({ min: 1, max: 1000 }),
          currency: PaymentCurrency.USD,
          status: PaymentStatus.SUCCEEDED,
          createdAt: new Date(),
        } as PaymentEntity,
        {
          id: faker.number.int(),
          jobId,
          type,
          amount: faker.number.int({ min: 1, max: 1000 }),
          currency: PaymentCurrency.USD,
          status: PaymentStatus.SUCCEEDED,
          createdAt: new Date(),
        } as PaymentEntity,
      ];

      jest
        .spyOn(paymentRepository, 'findByJobIdAndType')
        .mockResolvedValueOnce(mockPayments);

      const result = await paymentService.getJobPayments(jobId, type);

      expect(paymentRepository.findByJobIdAndType).toHaveBeenCalledWith(
        jobId,
        type,
      );
      expect(result).toEqual(mockPayments);
    });

    it('should return an empty array if no payments are found', async () => {
      const jobId = faker.number.int();
      const type = PaymentType.SLASH;

      jest
        .spyOn(paymentRepository, 'findByJobIdAndType')
        .mockResolvedValueOnce([]);

      const result = await paymentService.getJobPayments(jobId, type);

      expect(paymentRepository.findByJobIdAndType).toHaveBeenCalledWith(
        jobId,
        type,
      );
      expect(result).toEqual([]);
    });
  });
});
