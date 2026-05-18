import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { VerificationResult } from '@/common/types';
import { PgpEncryptionService } from '@/modules/encryption';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';

import {
  generateFortuneManifest,
  generateFortuneSolution,
  generateMarketingManifest,
  generateMarketingResult,
} from '../fixtures';
import { DefaultResultsProcessor } from './default-results-processor';
import { BaseEscrowResultsProcessor } from './escrow-results-processor';

const mockedStorageService = createMock<StorageService>();
const mockedPgpEncryptionService = createMock<PgpEncryptionService>();
const mockedWeb3Service = createMock<Web3Service>();

describe('DefaultResultsProcessor', () => {
  let processor: DefaultResultsProcessor;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DefaultResultsProcessor,
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

    processor = moduleRef.get<DefaultResultsProcessor>(DefaultResultsProcessor);
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
    const marketingManifest = generateMarketingManifest();

    it('throws if results is not json', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(faker.lorem.words()),
          marketingManifest,
        ),
      ).rejects.toThrow('Failed to parse results data');
    });

    it('throws if results is not array', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify({})),
          marketingManifest,
        ),
      ).rejects.toThrow('No final results found');
    });

    it('throws if results is empty array', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify([])),
          marketingManifest,
        ),
      ).rejects.toThrow('No final results found');
    });

    it('passes for marketing when results are not empty', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(
            JSON.stringify([
              generateMarketingResult(VerificationResult.Rejected),
            ]),
          ),
          marketingManifest,
        ),
      ).resolves.not.toThrow();
    });

    it('throws for fortune if accepted results are below required submissions', async () => {
      const fortuneManifest = generateFortuneManifest();
      const results = Array.from(
        { length: fortuneManifest.submissionsRequired },
        () => generateFortuneSolution(faker.string.sample()),
      );
      results.push(generateFortuneSolution());

      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify(results)),
          fortuneManifest,
        ),
      ).rejects.toThrow('Not all required results have been sent');
    });

    it('passes for fortune when required accepted results are present', async () => {
      const fortuneManifest = generateFortuneManifest();
      const results = Array.from(
        { length: fortuneManifest.submissionsRequired },
        () => generateFortuneSolution(),
      );
      results.push(generateFortuneSolution(faker.string.sample()));

      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify(results)),
          fortuneManifest,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('getFinalResultsFileName', () => {
    it('should return hash with extension', () => {
      const hash = faker.string.hexadecimal({ prefix: '', length: 40 });

      const name = processor['getFinalResultsFileName'](hash);

      expect(name).toBe(`${hash}.json`);
    });
  });
});
