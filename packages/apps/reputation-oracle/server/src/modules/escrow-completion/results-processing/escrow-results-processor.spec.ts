jest.mock('@human-protocol/sdk');

import * as crypto from 'crypto';

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowClient, EscrowUtils, IEscrow } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { JobManifest } from '@/common/types';
import { PgpEncryptionService } from '@/modules/encryption';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
import { generateTestnetChainId } from '@/modules/web3/fixtures';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';

class TestEscrowResultsProcessor extends BaseEscrowResultsProcessor<JobManifest> {
  override constructIntermediateResultsUrl = jest.fn();

  override assertResultsComplete = jest.fn();

  override getFinalResultsFileName = jest.fn();
}

const mockedStorageService = createMock<StorageService>();
const mockedPgpEncryptionService = createMock<PgpEncryptionService>();
const mockedWeb3Service = createMock<Web3Service>();

const mockedEscrowClient = jest.mocked(EscrowClient);
const mockedEscrowUtils = jest.mocked(EscrowUtils);

describe('BaseEscrowResultsProcessor', () => {
  let processor: TestEscrowResultsProcessor;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TestEscrowResultsProcessor,
        {
          provide: StorageService,
          useValue: mockedStorageService,
        },
        {
          provide: PgpEncryptionService,
          useValue: mockedPgpEncryptionService,
        },
        {
          provide: Web3Service,
          useValue: mockedWeb3Service,
        },
      ],
    }).compile();

    processor = moduleRef.get<TestEscrowResultsProcessor>(
      TestEscrowResultsProcessor,
    );
  });

  describe('storeResults', () => {
    const mockedGetIntermediateResultsUrl = jest
      .fn()
      .mockImplementation(async () => faker.internet.url());

    beforeAll(() => {
      mockedEscrowClient.build.mockResolvedValue({
        getIntermediateResultsUrl: mockedGetIntermediateResultsUrl,
      } as unknown as EscrowClient);
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should fail if downloaded results not complete', async () => {
      const testError = new Error(`Error: ${faker.string.ulid()}`);

      processor.assertResultsComplete.mockRejectedValueOnce(testError);

      await expect(
        processor.storeResults(
          faker.number.int(),
          faker.finance.ethereumAddress(),
          {} as unknown as JobManifest,
        ),
      ).rejects.toThrow(testError);
    });

    it('should throw if escrow is not found', async () => {
      const chainId = generateTestnetChainId();
      const escrowAddress = faker.finance.ethereumAddress();

      const baseResultsUrl = faker.internet.url();
      mockedGetIntermediateResultsUrl.mockResolvedValueOnce(baseResultsUrl);

      const resultsUrl = `${baseResultsUrl}/${faker.system.fileName()}`;
      processor.constructIntermediateResultsUrl.mockReturnValueOnce(resultsUrl);

      const resultsFileContent = Buffer.from(faker.lorem.sentence());
      mockedStorageService.downloadFile.mockResolvedValueOnce(
        resultsFileContent,
      );

      processor.assertResultsComplete.mockResolvedValueOnce(undefined);

      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(null);

      await expect(
        processor.storeResults(chainId, escrowAddress, {} as JobManifest),
      ).rejects.toThrow('Escrow not found');

      expect(mockedGetIntermediateResultsUrl).toHaveBeenCalledWith(
        escrowAddress,
      );
      expect(mockedStorageService.uploadData).toHaveBeenCalledTimes(0);
    });

    it('should store results as per workflow', async () => {
      /** ARRANGE */
      const chainId = generateTestnetChainId();
      const escrowAddress = faker.finance.ethereumAddress();

      const baseResultsUrl = faker.internet.url();
      mockedGetIntermediateResultsUrl.mockResolvedValueOnce(baseResultsUrl);

      const resultsUrl = `${baseResultsUrl}/${faker.system.fileName()}`;
      processor.constructIntermediateResultsUrl.mockReturnValueOnce(resultsUrl);

      const jobResult = faker.number.int();
      const resultsFileContent = Buffer.from(jobResult.toString());
      mockedStorageService.downloadFile.mockResolvedValueOnce(
        resultsFileContent,
      );

      processor.assertResultsComplete.mockResolvedValueOnce(undefined);

      processor.assertResultsComplete.mockImplementationOnce(
        async (result, manifest) => {
          if (Number(result) !== manifest.resultToAssert) {
            throw new Error('Incomplete test result');
          }
        },
      );

      const jobLauncherAddress = faker.finance.ethereumAddress();
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        launcher: jobLauncherAddress,
      } as unknown as IEscrow);

      const encryptedResult = faker.string.ulid();
      mockedPgpEncryptionService.encrypt.mockResolvedValueOnce(encryptedResult);

      const encryptedResultHash = crypto
        .createHash('sha256')
        .update(encryptedResult)
        .digest('hex');
      const storedResultsFileName = `${encryptedResultHash}.${faker.system.fileExt()}`;
      processor.getFinalResultsFileName.mockReturnValueOnce(
        storedResultsFileName,
      );

      const storedResultsUrl = faker.internet.url();
      mockedStorageService.uploadData.mockResolvedValueOnce(storedResultsUrl);

      /** ACT */
      const manifest = { resultToAssert: jobResult } as unknown as JobManifest;
      const storedResultMeta = await processor.storeResults(
        chainId,
        escrowAddress,
        manifest,
      );

      /** ASSERT */
      expect(storedResultMeta.url).toBe(storedResultsUrl);
      expect(storedResultMeta.hash).toBe(encryptedResultHash);

      expect(mockedGetIntermediateResultsUrl).toHaveBeenCalledWith(
        escrowAddress,
      );
      expect(processor.constructIntermediateResultsUrl).toHaveBeenCalledWith(
        baseResultsUrl,
      );
      expect(mockedStorageService.downloadFile).toHaveBeenCalledWith(
        resultsUrl,
      );
      expect(mockedEscrowUtils.getEscrow).toHaveBeenCalledWith(
        chainId,
        escrowAddress,
      );

      expect(mockedPgpEncryptionService.encrypt).toHaveBeenCalledTimes(1);
      expect(mockedPgpEncryptionService.encrypt).toHaveBeenCalledWith(
        resultsFileContent,
        chainId,
        [jobLauncherAddress],
      );

      expect(processor.getFinalResultsFileName).toHaveBeenCalledTimes(1);
      expect(processor.getFinalResultsFileName).toHaveBeenCalledWith(
        encryptedResultHash,
      );

      expect(mockedStorageService.uploadData).toHaveBeenCalledTimes(1);
      expect(mockedStorageService.uploadData).toHaveBeenCalledWith(
        encryptedResult,
        storedResultsFileName,
        'text/plain',
      );
    });
  });
});
