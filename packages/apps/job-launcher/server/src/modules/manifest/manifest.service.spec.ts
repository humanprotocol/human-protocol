import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Encryption } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorJob } from '../../common/constants/errors';
import { CvatJobType, FortuneJobType } from '../../common/enums/job';
import { ServerError, ValidationError } from '../../common/errors';
import { JobFortuneDto } from '../job/job.dto';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { ManifestService } from './manifest.service';
import { ManifestDto } from './manifest.dto';

describe('ManifestService', () => {
  let manifestService: ManifestService;
  const mockStorageService = {
    uploadJsonLikeData: jest.fn(),
    downloadJsonLikeData: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ManifestService,
        { provide: Web3Service, useValue: createMock<Web3Service>() },
        { provide: StorageService, useValue: mockStorageService },
        { provide: PGPConfigService, useValue: { encrypt: false } },
        { provide: Encryption, useValue: createMock<Encryption>() },
      ],
    }).compile();

    manifestService = moduleRef.get<ManifestService>(ManifestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createManifest', () => {
    it('should create a fortune manifest', async () => {
      const dto: JobFortuneDto = {
        requesterTitle: faker.lorem.sentence(),
        requesterDescription: faker.lorem.sentence(),
        submissionsRequired: faker.number.int({ min: 1, max: 100 }),
        paymentCurrency: faker.helpers.arrayElement([0, 1]) as any,
        paymentAmount: faker.number.int({ min: 1, max: 1000 }),
        escrowFundToken: faker.helpers.arrayElement(['HMT', 'USDC']) as any,
      };

      await expect(
        manifestService.createManifest(
          dto,
          FortuneJobType.FORTUNE,
          dto.paymentAmount,
        ),
      ).resolves.toEqual({
        ...dto,
        requestType: FortuneJobType.FORTUNE,
        fundAmount: dto.paymentAmount,
      });
    });

    it('should reject non-fortune request types', async () => {
      await expect(
        manifestService.createManifest(
          {} as JobFortuneDto,
          CvatJobType.IMAGE_BOXES,
          1,
        ),
      ).rejects.toThrow(new ValidationError(ErrorJob.InvalidRequestType));
    });
  });

  describe('uploadManifest', () => {
    it('should upload a manifest successfully', async () => {
      const mockChainId = faker.number.int();
      const mockData = { key: faker.lorem.word() };
      const mockOracleAddresses: string[] = [];
      const mockManifestData = {
        url: faker.internet.url(),
        hash: faker.string.uuid(),
      };

      mockStorageService.uploadJsonLikeData.mockResolvedValueOnce(
        mockManifestData,
      );

      const result = await manifestService.uploadManifest(
        mockChainId,
        mockData,
        mockOracleAddresses,
      );

      expect(result).toEqual(
        expect.objectContaining({
          url: mockManifestData.url,
          hash: mockManifestData.hash,
        }),
      );
    });

    it('should throw an error if upload fails', async () => {
      const mockChainId = faker.number.int();
      const mockData = { key: faker.lorem.word() };
      const mockOracleAddresses: string[] = [];

      mockStorageService.uploadJsonLikeData.mockRejectedValue(
        new ServerError('File not uploaded'),
      );

      await expect(
        manifestService.uploadManifest(
          mockChainId,
          mockData,
          mockOracleAddresses,
        ),
      ).rejects.toThrow(ServerError);
    });
  });

  describe('downloadManifest', () => {
    it('should download and validate a manifest successfully', async () => {
      const mockManifestUrl = faker.internet.url();
      const mockRequestType = FortuneJobType.FORTUNE;
      const mockManifest: ManifestDto = {
        submissionsRequired: faker.number.int({ min: 1, max: 100 }),
        requesterTitle: faker.lorem.words(3),
        requesterDescription: faker.lorem.sentence(),
        fundAmount: faker.number.float({ min: 1, max: 1000 }),
        requestType: FortuneJobType.FORTUNE,
        qualifications: [faker.lorem.word(), faker.lorem.word()],
      };
      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        mockManifest,
      );
      const result = await manifestService.downloadManifest(
        mockManifestUrl,
        mockRequestType,
      );
      expect(result).toEqual(mockManifest);
    });

    it('should throw an error if validation fails', async () => {
      const mockManifestUrl = faker.internet.url();
      const mockRequestType = CvatJobType.IMAGE_BOXES;
      const mockManifest: ManifestDto = {
        submissionsRequired: faker.number.int({ min: 1, max: 100 }),
        requesterTitle: faker.lorem.words(3),
        requesterDescription: faker.lorem.sentence(),
        fundAmount: faker.number.float({ min: 1, max: 1000 }),
        requestType: FortuneJobType.FORTUNE,
        qualifications: [faker.lorem.word(), faker.lorem.word()],
      };
      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        mockManifest,
      );
      await expect(
        manifestService.downloadManifest(mockManifestUrl, mockRequestType),
      ).rejects.toThrow(new ValidationError(ErrorJob.ManifestValidationFailed));
    });
  });
});
