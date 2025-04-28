import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';

import { FortuneFinalResult } from '../../../common/types';

import { PgpEncryptionService } from '../../encryption/pgp-encryption.service';
import { StorageService } from '../../storage/storage.service';
import { Web3Service } from '../../web3/web3.service';

import { generateFortuneManifest, generateFortuneSolution } from '../fixtures';
import { BaseEscrowResultsProcessor } from './escrow-results-processor';
import { FortuneResultsProcessor } from './fortune-results-processor';

const mockedStorageService = createMock<StorageService>();
const mockedPgpEncryptionService = createMock<PgpEncryptionService>();
const mockedWeb3Service = createMock<Web3Service>();

describe('FortuneResultsProcessor', () => {
  let processor: FortuneResultsProcessor;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FortuneResultsProcessor,
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

    processor = moduleRef.get<FortuneResultsProcessor>(FortuneResultsProcessor);
  });

  it('should be properly initialized', () => {
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(BaseEscrowResultsProcessor);
  });

  describe('constructIntermediateResultsUrl', () => {
    it('should return intermediate results url as is', () => {
      const baseUrl = faker.internet.url();
      const url = processor['constructIntermediateResultsUrl'](baseUrl);

      expect(url).toBe(baseUrl);
    });
  });

  describe('assertResultsComplete', () => {
    const testManifest = generateFortuneManifest();

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
      ).rejects.toThrow('No intermediate results found');
    });

    it('throws if results is empty array', async () => {
      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify([])),
          testManifest,
        ),
      ).rejects.toThrow('No intermediate results found');
    });

    it('throws if not all submissions sent', async () => {
      const solutions: FortuneFinalResult[] = Array.from(
        { length: testManifest.submissionsRequired },
        () => generateFortuneSolution(),
      );
      solutions.pop();
      solutions.push(generateFortuneSolution(faker.string.sample()));

      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify(solutions)),
          testManifest,
        ),
      ).rejects.toThrow('Not all required solutions have been sent');
    });

    it('passes when all solutions sent', async () => {
      const solutions: FortuneFinalResult[] = Array.from(
        { length: testManifest.submissionsRequired * 2 },
        (i: number) =>
          generateFortuneSolution(
            i % 2 === 0 ? faker.string.sample() : undefined,
          ),
      );

      await expect(
        processor['assertResultsComplete'](
          Buffer.from(JSON.stringify(solutions)),
          testManifest,
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
