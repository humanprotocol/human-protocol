import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { VerificationResult } from '@/common/types';
import { PgpEncryptionService } from '@/modules/encryption';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  generateMarketingManifest,
  generateMarketingResult,
} from '../fixtures';
import { BaseEscrowResultsProcessor } from './escrow-results-processor';
import { MarketingResultsProcessor } from './marketing-results-processor';

const mockedStorageService = createMock<StorageService>();
const mockedPgpEncryptionService = createMock<PgpEncryptionService>();
const mockedWeb3Service = createMock<Web3Service>();

describe('MarketingResultsProcessor', () => {
  let processor: MarketingResultsProcessor;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MarketingResultsProcessor,
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

    processor = moduleRef.get<MarketingResultsProcessor>(
      MarketingResultsProcessor,
    );
  });

  it('should be properly initialized', () => {
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(BaseEscrowResultsProcessor);
  });

  describe('constructIntermediateResultsUrl', () => {
    it('should return intermediate results url as is', () => {
      const baseUrl = faker.internet.url();

      expect(processor['constructIntermediateResultsUrl'](baseUrl)).toBe(
        baseUrl,
      );
    });
  });

  describe('assertResultsComplete', () => {
    const testManifest = generateMarketingManifest();

    it('throws if results is not json', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(faker.lorem.words()),
          testManifest,
        ),
      ).rejects.toThrow('Failed to parse results data');
    });

    it('throws if results is not array', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify({})),
          testManifest,
        ),
      ).rejects.toThrow('No final results found');
    });

    it('throws if results is empty array', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify([])),
          testManifest,
        ),
      ).rejects.toThrow('No final results found');
    });

    it('passes when there are accepted and rejected results', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(
            JSON.stringify([
              generateMarketingResult(VerificationResult.Accepted),
              generateMarketingResult(VerificationResult.Rejected),
            ]),
          ),
          testManifest,
        ),
      ).resolves.not.toThrow();
    });

    it('passes when there are only rejected results', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(
            JSON.stringify([
              generateMarketingResult(VerificationResult.Rejected),
            ]),
          ),
          testManifest,
        ),
      ).resolves.not.toThrow();
    });
  });
});
