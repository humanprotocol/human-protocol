import { HotWallet, RefillWallet } from '../src/wallet';
import { StorageService } from './storage';
import { ConfigService } from './config';
import { TokenId, Web3Service } from './web3';
import { ChainId, Encryption, NETWORKS } from '@human-protocol/sdk';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import {
  MOCK_WEB3_ADDRESS,
  MOCK_DAILY_LIMIT,
  MOCK_MAX_BALANCE,
  MOCK_MIN_BALANCE,
  MOCK_WEB3_PRIVATE_KEY,
  MOCK_WEB3_GAS_MULTIPLIER,
  MOCK_PGP_PRIVATE_KEY,
  MOCK_PGP_PUBLIC_KEY,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_USE_SSL,
  MOCK_WEB3_ENV,
  MOCK_SLACK_WEBHOOK_URL,
  MOCK_TRANSACTION_HASH,
  MOCK_RPC_URL,
} from '../test/constants';
import { sendSlackNotification } from './utils';
import { WalletError } from './errors';

jest.mock('./utils');
jest.mock('./storage');
jest.mock('./config');
jest.mock('./web3');

describe('Wallet manager', () => {
  let storageService: StorageService;
  let web3Service: Web3Service;
  let configService: ConfigService;

  beforeEach(async () => {
    configService = {
      pgpPrivateKey: MOCK_PGP_PRIVATE_KEY,
      pgpPublicKey: MOCK_PGP_PUBLIC_KEY,
      s3Endpoint: MOCK_S3_ENDPOINT,
      s3Port: MOCK_S3_PORT,
      s3AccessKey: MOCK_S3_ACCESS_KEY,
      s3SecretKey: MOCK_S3_SECRET_KEY,
      s3Bucket: MOCK_S3_BUCKET,
      s3UseSSL: MOCK_S3_USE_SSL,
      web3Env: MOCK_WEB3_ENV,
      web3GasPriceMultiplier: MOCK_WEB3_GAS_MULTIPLIER,
      web3PrivateKey: MOCK_WEB3_PRIVATE_KEY,
      web3HotWalletAddress: MOCK_WEB3_ADDRESS,
      hmtTokenMinBalanceRefillWallet: MOCK_MIN_BALANCE,
      hmtTokenMaxBalanceRefillWallet: MOCK_MAX_BALANCE,
      hmtTokenDailyLimitRefillWallet: MOCK_DAILY_LIMIT,
      nativeTokenMinBalanceRefillWallet: MOCK_MIN_BALANCE,
      nativeTokenMaxBalanceRefillWallet: MOCK_MAX_BALANCE,
      nativeTokenDailyLimitRefillWallet: MOCK_DAILY_LIMIT,
      hmtTokenMinBalanceHotWallet: MOCK_MIN_BALANCE,
      hmtTokenMaxBalanceHotWallet: MOCK_MAX_BALANCE,
      hmtTokenDailyLimitHotWallet: MOCK_DAILY_LIMIT,
      nativeTokenMinBalanceHotWallet: MOCK_MIN_BALANCE,
      nativeTokenMaxBalanceHotWallet: MOCK_MAX_BALANCE,
      nativeTokenDailyLimitHotWallet: MOCK_DAILY_LIMIT,
      slackWebhookUrl: MOCK_SLACK_WEBHOOK_URL,
    };

    web3Service = new Web3Service(configService);
    web3Service.getSigner = jest.fn();
    web3Service.getNetwork = jest.fn().mockReturnValue({
      chainId: ChainId.LOCALHOST,
      rpcUrl: MOCK_RPC_URL,
      tokens: {
        hmt: NETWORKS[ChainId.LOCALHOST]?.hmtAddress,
      },
    });

    storageService = new StorageService(
      await Encryption.build(configService.pgpPrivateKey),
      configService,
    );
  });

  describe('Refill wallet', () => {
    let refillWallet: RefillWallet;
    let hotWallet: HotWallet;

    describe('for HMT token', () => {
      beforeEach(async () => {
        jest.clearAllMocks();

        hotWallet = new HotWallet(
          ChainId.LOCALHOST,
          web3Service,
          storageService,
          configService,
          MOCK_WEB3_ADDRESS,
          TokenId.HMT,
        );

        refillWallet = new RefillWallet(
          ChainId.LOCALHOST,
          web3Service,
          storageService,
          configService,
          MOCK_WEB3_ADDRESS,
          TokenId.HMT,
        );
      });

      describe('transfer', () => {
        it('should transfer tokens when tokenAddress and tokenId match', async () => {
          const amount = BigInt(100);
          const receipt = {
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
          };

          const mockHMTokenFactoryContract = {
            transfer: jest.fn().mockResolvedValue({
              wait: jest.fn().mockResolvedValue(receipt),
            }),
          };
          jest
            .spyOn(HMToken__factory, 'connect')
            .mockReturnValue(mockHMTokenFactoryContract as any);

          const result = await refillWallet.transfer(hotWallet, amount);

          expect(mockHMTokenFactoryContract.transfer).toHaveBeenCalledWith(
            hotWallet.address,
            amount,
          );
          expect(result.tokenId).toBe(hotWallet.tokenId);
          expect(result.value).toBe(amount.toString());
        });

        it('should handle errors and throw', async () => {
          const amount = BigInt(100);

          const error = new Error('Failed to transfer funds');
          (HMToken__factory.connect as jest.Mock).mockReturnValueOnce({
            transfer: jest.fn().mockRejectedValue(error),
          });

          await expect(
            refillWallet.transfer(hotWallet, amount),
          ).rejects.toThrow(error);
        });
      });

      describe('refill', () => {
        it('should refill the hot wallet when it is verified and deposit amount is greater than 0', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(true);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(100));
          refillWallet.transfer = jest.fn().mockResolvedValue({
            tokenId: hotWallet.tokenId,
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            value: BigInt(50),
          });
          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await refillWallet.refill(hotWallet);

          expect(hotWallet.isVerified).toHaveBeenCalled();
          expect(hotWallet.calculateDepositAmount).toHaveBeenCalled();
          expect(refillWallet.transfer).toHaveBeenCalledWith(
            hotWallet,
            BigInt(100),
          );
          expect(hotWallet.saveTransaction).toHaveBeenCalled();
        });

        it('should not refill when hot wallet is not verified', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(false);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(100));
          refillWallet.transfer = jest.fn().mockResolvedValue({
            tokenId: hotWallet.tokenId,
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            value: BigInt(50),
          });
          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await expect(refillWallet.refill(hotWallet)).rejects.toThrow(
            'Wallet is not verified',
          );

          expect(hotWallet.isVerified).toHaveBeenCalled();
          expect(hotWallet.calculateDepositAmount).not.toHaveBeenCalled();
          expect(refillWallet.transfer).not.toHaveBeenCalled();
          expect(hotWallet.saveTransaction).not.toHaveBeenCalled();
        });

        it('should not refill when deposit amount is 0', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(true);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(0));
          refillWallet.transfer = jest.fn().mockResolvedValue({
            tokenId: hotWallet.tokenId,
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            value: BigInt(50),
          });
          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await refillWallet.refill(hotWallet);

          expect(hotWallet.isVerified).toHaveBeenCalled();
          expect(hotWallet.calculateDepositAmount).toHaveBeenCalled();
          expect(refillWallet.transfer).not.toHaveBeenCalled();
          expect(hotWallet.saveTransaction).not.toHaveBeenCalled();
        });

        it('should handle errors during refill', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(true);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(100));

          const error = new Error(WalletError.FAILED_REFILL_WALLET);
          refillWallet.transfer = jest.fn().mockRejectedValue(error);

          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await expect(refillWallet.refill(hotWallet)).rejects.toThrow(error);
        });
      });
    });

    describe('for NATIVE token', () => {
      beforeEach(async () => {
        jest.clearAllMocks();

        hotWallet = new HotWallet(
          ChainId.LOCALHOST,
          web3Service,
          storageService,
          configService,
          MOCK_WEB3_ADDRESS,
          TokenId.NATIVE,
        );

        refillWallet = new RefillWallet(
          ChainId.LOCALHOST,
          web3Service,
          storageService,
          configService,
          MOCK_WEB3_ADDRESS,
          TokenId.NATIVE,
        );
      });

      describe('transfer', () => {
        it('should transfer tokens when tokenAddress and tokenId match', async () => {
          const amount = BigInt(100);
          const receipt = {
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
          };

          refillWallet.signer = {
            sendTransaction: jest.fn().mockResolvedValue({
              wait: jest.fn().mockResolvedValue(receipt),
            }),
          } as any;

          const result = await refillWallet.transfer(hotWallet, amount);

          expect(refillWallet.signer.sendTransaction).toHaveBeenCalledWith({
            to: hotWallet.address,
            value: amount,
          });
          expect(result.tokenId).toBe(hotWallet.tokenId);
          expect(result.value).toBe(amount.toString());
        });

        it('should handle errors and throw', async () => {
          const amount = BigInt(100);

          const error = new Error('Failed to transfer funds');
          refillWallet.signer = {
            sendTransaction: jest.fn().mockRejectedValue(error),
          } as any;

          await expect(
            refillWallet.transfer(hotWallet, amount),
          ).rejects.toThrow(error);
        });
      });

      describe('refill', () => {
        it('should refill the hot wallet when it is verified and deposit amount is greater than 0', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(true);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(100));
          refillWallet.transfer = jest.fn().mockResolvedValue({
            tokenId: hotWallet.tokenId,
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            value: BigInt(50),
          });
          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await refillWallet.refill(hotWallet);

          expect(hotWallet.isVerified).toHaveBeenCalled();
          expect(hotWallet.calculateDepositAmount).toHaveBeenCalled();
          expect(refillWallet.transfer).toHaveBeenCalledWith(
            hotWallet,
            BigInt(100),
          );
          expect(hotWallet.saveTransaction).toHaveBeenCalled();
        });

        it('should not refill when hot wallet is not verified', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(false);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(100));
          refillWallet.transfer = jest.fn().mockResolvedValue({
            tokenId: hotWallet.tokenId,
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            value: BigInt(50),
          });
          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await expect(refillWallet.refill(hotWallet)).rejects.toThrow(
            'Wallet is not verified',
          );

          expect(hotWallet.isVerified).toHaveBeenCalled();
          expect(hotWallet.calculateDepositAmount).not.toHaveBeenCalled();
          expect(refillWallet.transfer).not.toHaveBeenCalled();
          expect(hotWallet.saveTransaction).not.toHaveBeenCalled();
        });

        it('should not refill when deposit amount is 0', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(true);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(0));
          refillWallet.transfer = jest.fn().mockResolvedValue({
            tokenId: hotWallet.tokenId,
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            value: BigInt(50),
          });
          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await refillWallet.refill(hotWallet);

          expect(hotWallet.isVerified).toHaveBeenCalled();
          expect(hotWallet.calculateDepositAmount).toHaveBeenCalled();
          expect(refillWallet.transfer).not.toHaveBeenCalled();
          expect(hotWallet.saveTransaction).not.toHaveBeenCalled();
        });

        it('should handle errors during refill', async () => {
          hotWallet.isVerified = jest.fn().mockResolvedValue(true);
          hotWallet.calculateDepositAmount = jest
            .fn()
            .mockResolvedValue(BigInt(100));

          const error = new Error(WalletError.FAILED_REFILL_WALLET);
          refillWallet.transfer = jest.fn().mockRejectedValue(error);

          hotWallet.saveTransaction = jest.fn().mockResolvedValue(true);

          await expect(refillWallet.refill(hotWallet)).rejects.toThrow(error);
        });
      });
    });
  });

  describe('Hot wallet', () => {
    let hotWallet: HotWallet;

    describe('for HMT token', () => {
      beforeEach(async () => {
        jest.clearAllMocks();
        hotWallet = new HotWallet(
          ChainId.LOCALHOST,
          web3Service,
          storageService,
          configService,
          MOCK_WEB3_ADDRESS,
          TokenId.HMT,
        );
      });

      describe('getBalance', () => {
        it('should fetch token balance', async () => {
          const amount = BigInt(100);

          const mockHMTokenFactoryContract = {
            balanceOf: jest.fn().mockResolvedValue(amount),
          };
          jest
            .spyOn(HMToken__factory, 'connect')
            .mockReturnValue(mockHMTokenFactoryContract as any);

          const balance = await hotWallet.getBalance();

          expect(balance).toBe(amount);
          expect(mockHMTokenFactoryContract.balanceOf).toHaveBeenCalledWith(
            MOCK_WEB3_ADDRESS,
          );
        });
      });

      describe('getDailyLimit', () => {
        it('should return BigInt(0) when no data is available', async () => {
          storageService.download = jest.fn().mockResolvedValueOnce([]);

          const dailyLimit = await hotWallet.getDailyLimit();

          expect(dailyLimit).toBe(BigInt(0));
        });

        it('should calculate daily limit correctly for wallet token when data is available', async () => {
          const mockTransactions = [
            { tokenId: TokenId.HMT, value: '100' },
            { tokenId: TokenId.HMT, value: '200' },
            { tokenId: TokenId.NATIVE, value: '999' },
          ];

          storageService.download = jest
            .fn()
            .mockResolvedValueOnce(mockTransactions);

          const dailyLimit = await hotWallet.getDailyLimit();

          expect(Number(dailyLimit)).toBe(300);
        });

        it('should throw error if fetching daily limits fails', async () => {
          const mockError = new Error('Mock error');
          storageService.download = jest.fn().mockRejectedValueOnce(mockError);

          await expect(hotWallet.getDailyLimit()).rejects.toThrow(
            WalletError.FAILED_GET_DAILY_LIMITS,
          );
        });
      });

      describe('saveTransaction', () => {
        it('should save transaction successfully when no existing data is available', async () => {
          storageService.download = jest.fn().mockResolvedValueOnce([]);
          storageService.upload = jest.fn().mockResolvedValueOnce(true);

          const result = await hotWallet.saveTransaction({
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            tokenId: TokenId.HMT,
            value: '100',
          });

          expect(result).toBe(true);
          expect(storageService.upload).toHaveBeenCalledWith(
            [
              {
                hash: MOCK_TRANSACTION_HASH,
                blockNumber: 123,
                tokenId: TokenId.HMT,
                value: '100',
              },
            ],
            MOCK_WEB3_ADDRESS,
          );
        });

        it('should save transaction successfully and overwrite existing data if block is not in current day', async () => {
          const mockData = [
            {
              hash: MOCK_TRANSACTION_HASH,
              blockNumber: 123,
              tokenId: TokenId.HMT,
              value: '200',
            },
          ];
          storageService.download = jest.fn().mockResolvedValueOnce(mockData);
          storageService.upload = jest.fn().mockResolvedValueOnce(true);

          hotWallet.isBlockInCurrentDay = jest
            .fn()
            .mockResolvedValueOnce(false);

          const result = await hotWallet.saveTransaction({
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            tokenId: TokenId.HMT,
            value: '100',
          });

          expect(result).toBe(true);
          expect(storageService.upload).toHaveBeenCalledWith(
            [
              {
                hash: MOCK_TRANSACTION_HASH,
                blockNumber: 123,
                tokenId: TokenId.HMT,
                value: '100',
              },
            ],
            MOCK_WEB3_ADDRESS,
          );
        });

        it('should save transaction successfully and append to existing data if block is in current day', async () => {
          const mockData = [
            {
              hash: MOCK_TRANSACTION_HASH,
              blockNumber: 123,
              tokenId: TokenId.HMT,
              value: '200',
            },
          ];
          storageService.download = jest.fn().mockResolvedValueOnce(mockData);
          storageService.upload = jest.fn().mockResolvedValueOnce(true);

          hotWallet.isBlockInCurrentDay = jest.fn().mockResolvedValueOnce(true);

          const result = await hotWallet.saveTransaction({
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 124,
            tokenId: TokenId.HMT,
            value: '100',
          });

          expect(result).toBe(true);
          expect(storageService.upload).toHaveBeenCalledWith(
            mockData,
            MOCK_WEB3_ADDRESS,
          );
        });

        it('should throw error and log if saving transaction fails', async () => {
          const mockError = new Error('Mock error');
          storageService.download = jest.fn().mockResolvedValueOnce([]);
          storageService.upload = jest.fn().mockRejectedValueOnce(mockError);

          await expect(
            hotWallet.saveTransaction({
              hash: MOCK_TRANSACTION_HASH,
              blockNumber: 123,
              tokenId: TokenId.HMT,
              value: '100',
            }),
          ).rejects.toThrow(WalletError.FAILED_SAVE_TRANSACTION);
        });
      });

      describe('calculateDepositAmount', () => {
        it('should calculate deposit amount correctly', async () => {
          hotWallet.getBalance = jest.fn().mockResolvedValue(BigInt(500));

          hotWallet.getDailyLimit = jest.fn().mockResolvedValue(BigInt(1000));

          const depositAmount = await hotWallet.calculateDepositAmount();
          expect(depositAmount).toBe(BigInt(500));
          expect(sendSlackNotification).toHaveBeenCalledTimes(0);
        });

        it('should handle case when balance is below minimum', async () => {
          hotWallet.getBalance = jest.fn().mockResolvedValue(BigInt(5));

          hotWallet.getDailyLimit = jest.fn().mockResolvedValue(BigInt(1000));

          const depositAmount = await hotWallet.calculateDepositAmount();
          expect(depositAmount).toBe(BigInt(995n));
          expect(sendSlackNotification).toHaveBeenCalledWith(
            `${MOCK_WEB3_ADDRESS} token balance below minimum.`,
          );
        });
      });
    });

    describe('for NATIVE token', () => {
      beforeEach(async () => {
        jest.clearAllMocks();
        hotWallet = new HotWallet(
          ChainId.LOCALHOST,
          web3Service,
          storageService,
          configService,
          MOCK_WEB3_ADDRESS,
          TokenId.NATIVE,
        );
      });

      describe('getBalance', () => {
        it('should fetch token balance', async () => {
          const amount = BigInt(1000000000000000000); // 1 ETH in wei

          hotWallet.signer = {
            provider: {
              getBalance: jest.fn().mockResolvedValue(amount),
            },
          } as any;

          const balance = await hotWallet.getBalance();

          expect(balance).toBe(amount);
          expect(hotWallet.signer.provider?.getBalance).toHaveBeenCalledWith(
            MOCK_WEB3_ADDRESS,
          );
        });
      });

      describe('getDailyLimit', () => {
        it('should return BigInt(0) when no data is available', async () => {
          storageService.download = jest.fn().mockResolvedValueOnce([]);

          const dailyLimit = await hotWallet.getDailyLimit();

          expect(dailyLimit).toBe(BigInt(0));
        });

        it('should calculate daily limit correctly for wallet chain native token when data is available', async () => {
          const mockTransactions = [
            { tokenId: TokenId.NATIVE, value: '100' },
            { tokenId: TokenId.NATIVE, value: '200' },
            { tokenId: TokenId.HMT, value: '999' },
          ];

          storageService.download = jest
            .fn()
            .mockResolvedValueOnce(mockTransactions);

          const dailyLimit = await hotWallet.getDailyLimit();

          expect(Number(dailyLimit)).toBe(300);
        });

        it('should throw error if fetching daily limits fails', async () => {
          const mockError = new Error('Mock error');
          storageService.download = jest.fn().mockRejectedValueOnce(mockError);

          await expect(hotWallet.getDailyLimit()).rejects.toThrow(
            WalletError.FAILED_GET_DAILY_LIMITS,
          );
        });
      });

      describe('saveTransaction', () => {
        it('should save transaction successfully when no existing data is available', async () => {
          storageService.download = jest.fn().mockResolvedValueOnce([]);
          storageService.upload = jest.fn().mockResolvedValueOnce(true);

          const result = await hotWallet.saveTransaction({
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            tokenId: TokenId.NATIVE,
            value: '100',
          });

          expect(result).toBe(true);
          expect(storageService.upload).toHaveBeenCalledWith(
            [
              {
                hash: MOCK_TRANSACTION_HASH,
                blockNumber: 123,
                tokenId: TokenId.NATIVE,
                value: '100',
              },
            ],
            MOCK_WEB3_ADDRESS,
          );
        });

        it('should save transaction successfully and overwrite existing data if block is not in current day', async () => {
          const mockData = [
            {
              hash: MOCK_TRANSACTION_HASH,
              blockNumber: 123,
              tokenId: TokenId.NATIVE,
              value: '200',
            },
          ];
          storageService.download = jest.fn().mockResolvedValueOnce(mockData);
          storageService.upload = jest.fn().mockResolvedValueOnce(true);

          hotWallet.isBlockInCurrentDay = jest
            .fn()
            .mockResolvedValueOnce(false);

          const result = await hotWallet.saveTransaction({
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 123,
            tokenId: TokenId.NATIVE,
            value: '100',
          });

          expect(result).toBe(true);
          expect(storageService.upload).toHaveBeenCalledWith(
            [
              {
                hash: MOCK_TRANSACTION_HASH,
                blockNumber: 123,
                tokenId: TokenId.NATIVE,
                value: '100',
              },
            ],
            MOCK_WEB3_ADDRESS,
          );
        });

        it('should save transaction successfully and append to existing data if block is in current day', async () => {
          const mockData = [
            {
              hash: MOCK_TRANSACTION_HASH,
              blockNumber: 123,
              tokenId: TokenId.NATIVE,
              value: '200',
            },
          ];
          storageService.download = jest.fn().mockResolvedValueOnce(mockData);
          storageService.upload = jest.fn().mockResolvedValueOnce(true);

          hotWallet.isBlockInCurrentDay = jest.fn().mockResolvedValueOnce(true);

          const result = await hotWallet.saveTransaction({
            hash: MOCK_TRANSACTION_HASH,
            blockNumber: 124,
            tokenId: TokenId.NATIVE,
            value: '100',
          });

          expect(result).toBe(true);
          expect(storageService.upload).toHaveBeenCalledWith(
            mockData,
            MOCK_WEB3_ADDRESS,
          );
        });

        it('should throw error and log if saving transaction fails', async () => {
          const mockError = new Error('Mock error');
          storageService.download = jest.fn().mockResolvedValueOnce([]);
          storageService.upload = jest.fn().mockRejectedValueOnce(mockError);

          await expect(
            hotWallet.saveTransaction({
              hash: MOCK_TRANSACTION_HASH,
              blockNumber: 123,
              tokenId: TokenId.NATIVE,
              value: '100',
            }),
          ).rejects.toThrow(WalletError.FAILED_SAVE_TRANSACTION);
        });
      });

      describe('calculateDepositAmount', () => {
        it('should calculate deposit amount correctly', async () => {
          hotWallet.getBalance = jest.fn().mockResolvedValue(BigInt(500));

          hotWallet.getDailyLimit = jest.fn().mockResolvedValue(BigInt(1000));

          const depositAmount = await hotWallet.calculateDepositAmount();

          expect(depositAmount).toBe(BigInt(500));
          expect(sendSlackNotification).toHaveBeenCalledTimes(0);
        });

        it('should handle case when balance is below minimum', async () => {
          hotWallet.getBalance = jest.fn().mockResolvedValue(BigInt(5));

          hotWallet.getDailyLimit = jest.fn().mockResolvedValue(BigInt(1000));

          const depositAmount = await hotWallet.calculateDepositAmount();
          expect(depositAmount).toBe(BigInt(995n));
          expect(sendSlackNotification).toHaveBeenCalledWith(
            `${MOCK_WEB3_ADDRESS} token balance below minimum.`,
          );
        });
      });
    });
  });
});
