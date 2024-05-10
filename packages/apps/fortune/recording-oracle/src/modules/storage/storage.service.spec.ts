import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  KVStoreClient,
  StorageClient,
} from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MOCK_ADDRESS, MOCK_FILE_URL } from '../../../test/constants';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { Web3Service } from '../web3/web3.service';
import { StorageService } from './storage.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
  },
  Encryption: {
    build: jest.fn(),
  },
  EncryptionUtils: {
    encrypt: jest.fn(),
  },
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      getPublicKey: jest.fn(),
    })),
  },
  EscrowClient: {
    build: jest.fn(),
  },
}));

jest.mock('minio', () => {
  class Client {
    putObject = jest.fn();
    bucketExists = jest.fn();
    constructor() {
      (this as any).protocol = 'http:';
      (this as any).host = 'localhost';
      (this as any).port = 9000;
    }
  }

  return { Client };
});

describe('StorageService', () => {
  let storageService: StorageService;
  let pgpConfigService: PGPConfigService;
  let s3ConfigService: S3ConfigService;

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        ConfigService,
        PGPConfigService,
        S3ConfigService,
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
    pgpConfigService = moduleRef.get<PGPConfigService>(PGPConfigService);
    s3ConfigService = moduleRef.get<S3ConfigService>(S3ConfigService);
  });

  describe('uploadJobSolutions', () => {
    beforeAll(async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getReputationOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      }));
    });
    it('should upload the solutions with encryption correctly', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';
      const hash = 'd92342976d720ff38cf5dcb329be41959ab1ba6c';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(true);

      EncryptionUtils.encrypt = jest.fn().mockResolvedValue('encrypted');

      (KVStoreClient.build as jest.Mock).mockResolvedValue({
        getPublicKey: jest.fn().mockResolvedValue('publicKey'),
      });
      jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(true);

      const jobSolution = {
        workerAddress,
        solution,
      };
      const fileData = await storageService.uploadJobSolutions(
        escrowAddress,
        chainId,
        [jobSolution],
      );

      expect(fileData).toEqual({
        url: `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/${hash}.json`,
        hash,
      });
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        s3ConfigService.bucket,
        `${hash}.json`,
        'encrypted',
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );
    });

    it('should fail if the bucket does not exist', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(false);

      const jobSolution = {
        workerAddress,
        solution,
      };
      await expect(
        storageService.uploadJobSolutions(escrowAddress, chainId, [
          jobSolution,
        ]),
      ).rejects.toThrow('Bucket not found');
    });

    it('should fail if the file cannot be uploaded', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(true);
      storageService.minioClient.putObject = jest
        .fn()
        .mockRejectedValue('Network error');
      jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(false);
      const jobSolution = {
        workerAddress,
        solution,
      };

      await expect(
        storageService.uploadJobSolutions(escrowAddress, chainId, [
          jobSolution,
        ]),
      ).rejects.toThrow('File not uploaded');
    });

    it('should fail if public key is missing', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(true);
      EncryptionUtils.encrypt = jest.fn().mockResolvedValue('encrypted');
      (KVStoreClient.build as jest.Mock).mockResolvedValue({
        getPublicKey: jest.fn().mockResolvedValue(''),
      });
      jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(true);
      const jobSolution = {
        workerAddress,
        solution,
      };
      await expect(
        storageService.uploadJobSolutions(escrowAddress, chainId, [
          jobSolution,
        ]),
      ).rejects.toThrow('Encryption error');
    });
  });

  describe('download', () => {
    it('should download the non encrypted file correctly', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const expectedJobFile = {
        exchangeAddress,
        solutions: [
          {
            workerAddress,
            solution,
          },
        ],
      };

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(expectedJobFile);
      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(false);
      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual(expectedJobFile);
    });

    it('should download the encrypted file correctly', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const expectedJobFile = {
        exchangeAddress,
        solutions: [
          {
            workerAddress,
            solution,
          },
        ],
      };

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue('encrypted-content');

      Encryption.build = jest.fn().mockResolvedValue({
        decrypt: jest.fn().mockResolvedValue(JSON.stringify(expectedJobFile)),
      });
      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual(expectedJobFile);
    });

    it('should return empty array when file cannot be downloaded', async () => {
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockRejectedValue('Network error');

      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual([]);
    });
  });
});
