import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';

import { PgpEncryptionService } from '../../encryption';
import { StorageService } from '../../storage';
import { Web3Service } from '../../web3';

import { BaseEscrowResultsProcessor } from './escrow-results-processor';
import { CvatResultsProcessor } from './cvat-results-processor';

const mockedStorageService = createMock<StorageService>();
const mockedPgpEncryptionService = createMock<PgpEncryptionService>();
const mockedWeb3Service = createMock<Web3Service>();

describe('CvatResultsProcessor', () => {
  let processor: CvatResultsProcessor;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CvatResultsProcessor,
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

    processor = moduleRef.get<CvatResultsProcessor>(CvatResultsProcessor);
  });

  it('should be properly initialized', () => {
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(BaseEscrowResultsProcessor);
  });

  describe('constructIntermediateResultsUrl', () => {
    it('should return annotations file url', () => {
      const baseUrl = faker.internet.url();
      const url = processor['constructIntermediateResultsUrl'](baseUrl);

      expect(url).toBe(`${baseUrl}/resulting_annotations.zip`);
    });
  });

  describe('assertResultsComplete', () => {
    it('always passes', async () => {
      await expect(processor['assertResultsComplete']()).resolves.not.toThrow();
    });
  });

  describe('getFinalResultsFileName', () => {
    it('should return hash with extension', () => {
      const hash = faker.string.hexadecimal({ prefix: '', length: 40 });

      const name = processor['getFinalResultsFileName'](hash);

      expect(name).toBe(`${hash}.zip`);
    });
  });
});
