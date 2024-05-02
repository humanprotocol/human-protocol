import axios from 'axios';
import { ConfigService } from './config';
import { StorageService } from './storage';
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
} from '../test/constants';
import { StorageError } from './errors';

const mockEncryption = {
  decrypt: jest.fn().mockResolvedValue('decryptedData'),
  signAndEncrypt: jest.fn().mockResolvedValue('encryptedData'),
};

jest.mock('minio', () => {
  class Client {
    bucketExists = jest.fn().mockResolvedValue(true);
    putObject = jest.fn();
    statObject = jest.fn().mockResolvedValue(true);
    removeObject = jest.fn();
    constructor() {
      (this as any).protocol = 'http:';
      (this as any).host = 'localhost';
      (this as any).port = 9000;
    }
  }

  return { Client };
});

jest.mock('axios');

describe('StorageService', () => {
  let storageService: StorageService;
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
    storageService = new StorageService(mockEncryption as any, configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('download', () => {
    it('should download and decrypt data', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: 'encryptedData',
        status: 200,
      });

      const result = await storageService.download('key');

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:9000/history/key',
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
      expect(mockEncryption.decrypt).toHaveBeenCalledWith('encryptedData');
      expect(result).toEqual('decryptedData');
    });

    it('should return empty array if download fails', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error());

      const result = await storageService.download('key');

      expect(result).toEqual([]);
    });
  });

  describe('upload', () => {
    it('should upload data', async () => {
      const result = await storageService.upload({ data: 'data' }, 'key');

      expect(mockEncryption.signAndEncrypt).toHaveBeenCalledWith(
        JSON.stringify({ data: 'data' }),
        [MOCK_PGP_PUBLIC_KEY],
      );
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        'history',
        'key',
        'encryptedData',
        { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
      );
      expect(result).toEqual('http://localhost:9000/history/key');
    });

    it('should throw error if bucket does not exist', async () => {
      (storageService.minioClient.bucketExists as jest.Mock).mockResolvedValue(
        false,
      );

      await expect(
        storageService.upload({ data: 'data' }, 'key'),
      ).rejects.toThrow(StorageError.BUCKET_NOT_EXIST);
    });

    it('should throw error if file upload fails', async () => {
      (storageService.minioClient.putObject as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await expect(
        storageService.upload({ data: 'data' }, 'key'),
      ).rejects.toThrow(StorageError.FILE_NOT_UPLOADED);
    });
  });

  describe('update', () => {
    it('should update existing file', async () => {
      const result = await storageService.update({ data: 'data' }, 'key');

      expect(storageService.minioClient.statObject).toHaveBeenCalledWith(
        'history',
        'key',
      );
      expect(storageService.minioClient.removeObject).toHaveBeenCalledWith(
        'history',
        'key',
      );
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        'history',
        'key',
        'encryptedData',
        { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
      );
      expect(result).toEqual('http://localhost:9000/history/key');
    });

    it('should throw error if failed to update file', async () => {
      (storageService.minioClient.statObject as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await expect(
        storageService.update({ data: 'data' }, 'key'),
      ).rejects.toThrow(StorageError.FAILD_UPDATE_FILE);
    });
  });

  describe('delete', () => {
    it('should delete file', async () => {
      await storageService.delete('key');
      expect(storageService.minioClient.removeObject).toHaveBeenCalledWith(
        'history',
        'key',
      );
    });

    it('should throw error if failed to delete file', async () => {
      (storageService.minioClient.removeObject as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await expect(storageService.delete('key')).rejects.toThrow(
        StorageError.FAILED_DELETE_OBJECT,
      );
    });
  });
});
