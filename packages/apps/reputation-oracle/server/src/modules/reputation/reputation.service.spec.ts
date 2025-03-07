import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient } from '@human-protocol/sdk';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ReputationEntity } from './reputation.entity';
import {
  MOCK_ADDRESS,
  MOCK_FILE_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  mockConfig,
} from '../../../test/constants';
import {
  JobRequestType,
  ReputationEntityType,
  ReputationLevel,
  SolutionError,
} from '../../common/enums';
import { Web3Service } from '../web3/web3.service';
import { StorageService } from '../storage/storage.service';
import { ReputationConfigService } from '../../config/reputation-config.service';
import { ReputationError, ReputationErrorMessage } from './reputation.error';
import { Web3ConfigService } from '../../config/web3-config.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
    })),
  },
}));

describe('ReputationService', () => {
  let reputationService: ReputationService,
    reputationRepository: ReputationRepository,
    storageService: StorageService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs('s3', () => ({
            accessKey: MOCK_S3_ACCESS_KEY,
            secretKey: MOCK_S3_SECRET_KEY,
            endPoint: MOCK_S3_ENDPOINT,
            port: MOCK_S3_PORT,
            useSSL: MOCK_S3_USE_SSL,
            bucket: MOCK_S3_BUCKET,
          })),
        ),
      ],
      providers: [
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
        Web3ConfigService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: StorageService, useValue: createMock<StorageService>() },
        ReputationService,
        {
          provide: ReputationRepository,
          useValue: createMock<ReputationRepository>(),
        },
        ReputationConfigService,
      ],
    }).compile();

    reputationService = moduleRef.get<ReputationService>(ReputationService);
    reputationRepository = moduleRef.get(ReputationRepository);
    storageService = moduleRef.get<StorageService>(StorageService);
  });

  describe('assessReputationScores', () => {
    const chainId = ChainId.LOCALHOST;
    const escrowAddress = 'mockEscrowAddress';

    describe('fortune', () => {
      it('should assess reputation scores', async () => {
        const manifest = {
          requestType: JobRequestType.FORTUNE,
        };
        const finalResults = [
          { workerAddress: 'worker1', error: undefined },
          { workerAddress: 'worker2', error: SolutionError.Duplicated },
        ];

        jest
          .spyOn(storageService, 'downloadJsonLikeData')
          .mockResolvedValueOnce(manifest)
          .mockResolvedValueOnce(finalResults);

        jest.spyOn(reputationService, 'increaseReputation').mockResolvedValue();
        jest.spyOn(reputationService, 'decreaseReputation').mockResolvedValue();

        await reputationService.assessReputationScores(chainId, escrowAddress);

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          MOCK_ADDRESS,
          ReputationEntityType.JOB_LAUNCHER,
        );

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          'worker1',
          ReputationEntityType.WORKER,
        );

        expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
          chainId,
          'worker2',
          ReputationEntityType.WORKER,
        );

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          MOCK_ADDRESS,
          ReputationEntityType.EXCHANGE_ORACLE,
        );

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          MOCK_ADDRESS,
          ReputationEntityType.RECORDING_ORACLE,
        );
      });
    });

    describe('cvat', () => {
      const manifest = {
        requestType: JobRequestType.IMAGE_BOXES,
        data: {
          data_url: MOCK_FILE_URL,
        },
        annotation: {
          labels: [{ name: 'cat' }, { name: 'dog' }],
          description: 'Description',
          type: JobRequestType.IMAGE_BOXES,
          job_size: 10,
          max_time: 10,
        },
        validation: {
          min_quality: 0.95,
          val_size: 10,
          gt_url: MOCK_FILE_URL,
        },
        job_bounty: '10',
      };

      (EscrowClient.build as any).mockImplementation(() => ({
        getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
        getIntermediateResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      }));

      it('should assess reputation scores', async () => {
        const annotationMeta = {
          jobs: [
            {
              id: 1,
              job_id: 1,
              annotator_wallet_address: 'worker1',
              annotation_quality: 0.96,
            },
            {
              id: 2,
              job_id: 2,
              annotator_wallet_address: 'worker2',
              annotation_quality: 0.94,
            },
          ],
          results: [
            {
              id: 1,
              job_id: 1,
              annotator_wallet_address: 'worker1',
              annotation_quality: 0.96,
            },
            {
              id: 2,
              job_id: 2,
              annotator_wallet_address: 'worker2',
              annotation_quality: 0.94,
            },
          ],
        };

        jest
          .spyOn(storageService, 'downloadJsonLikeData')
          .mockResolvedValueOnce(manifest)
          .mockResolvedValueOnce(annotationMeta);

        jest.spyOn(reputationService, 'increaseReputation').mockResolvedValue();
        jest.spyOn(reputationService, 'decreaseReputation').mockResolvedValue();

        await reputationService.assessReputationScores(chainId, escrowAddress);

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          MOCK_ADDRESS,
          ReputationEntityType.JOB_LAUNCHER,
        );

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          'worker1',
          ReputationEntityType.WORKER,
        );

        expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
          chainId,
          'worker2',
          ReputationEntityType.WORKER,
        );

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          MOCK_ADDRESS,
          ReputationEntityType.EXCHANGE_ORACLE,
        );

        expect(reputationService.increaseReputation).toHaveBeenCalledWith(
          chainId,
          MOCK_ADDRESS,
          ReputationEntityType.RECORDING_ORACLE,
        );
      });
    });
  });

  describe('increaseReputation', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;
    const type = ReputationEntityType.WORKER;

    it('should create a new reputation entity if not found', async () => {
      jest
        .spyOn(reputationRepository, 'findOneByAddress')
        .mockResolvedValueOnce(undefined as any);
      jest.spyOn(reputationRepository, 'createUnique');

      await reputationService.increaseReputation(chainId, address, type);

      expect(reputationRepository.findOneByAddress).toHaveBeenCalledWith(
        address,
      );
      expect(reputationRepository.createUnique).toHaveBeenCalledWith({
        chainId,
        address,
        reputationPoints: 1,
        type,
      });
    });

    it('should create a new reputation entity with Reputation Oracle type if not found', async () => {
      jest
        .spyOn(reputationRepository, 'findOneByAddress')
        .mockResolvedValueOnce(undefined as any);
      jest.spyOn(reputationRepository, 'createUnique');

      await reputationService.increaseReputation(
        chainId,
        address,
        ReputationEntityType.REPUTATION_ORACLE,
      );

      expect(reputationRepository.findOneByAddress).toHaveBeenCalledWith(
        address,
      );
      expect(reputationRepository.createUnique).toHaveBeenCalledWith({
        chainId,
        address,
        reputationPoints: 700,
        type: ReputationEntityType.REPUTATION_ORACLE,
      });
    });

    it('should increase reputation points if entity found', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        address,
        reputationPoints: 1,
        type: ReputationEntityType.RECORDING_ORACLE,
      };

      jest
        .spyOn(reputationRepository, 'findOneByAddress')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      await reputationService.increaseReputation(chainId, address, type);

      expect(reputationRepository.findOneByAddress).toHaveBeenCalledWith(
        address,
      );
      expect(reputationEntity.reputationPoints).toBe(2);
      expect(reputationRepository.updateOne).toHaveBeenCalled();
    });
  });

  describe('decreaseReputation', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;
    const type = ReputationEntityType.WORKER;

    it('should create a new reputation entity if not found', async () => {
      jest
        .spyOn(reputationRepository, 'findOneByAddress')
        .mockResolvedValueOnce(undefined as any);
      jest.spyOn(reputationRepository, 'createUnique');

      await reputationService.decreaseReputation(chainId, address, type);

      expect(reputationRepository.findOneByAddress).toHaveBeenCalledWith(
        address,
      );
      expect(reputationRepository.createUnique).toHaveBeenCalledWith({
        chainId,
        address,
        reputationPoints: 0,
        type,
      });
    });

    it('should decrease reputation points if entity found', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        address,
        reputationPoints: 1,
        type: ReputationEntityType.RECORDING_ORACLE,
      };

      jest
        .spyOn(reputationRepository, 'findOneByAddress')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      await reputationService.decreaseReputation(chainId, address, type);

      expect(reputationRepository.findOneByAddress).toHaveBeenCalledWith(
        address,
      );
      expect(reputationEntity.reputationPoints).toBe(0);
      expect(reputationRepository.updateOne).toHaveBeenCalled();
    });

    it('should return if called for Reputation Oracle itself', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        address,
        reputationPoints: 701,
        type: ReputationEntityType.RECORDING_ORACLE,
      };

      jest
        .spyOn(reputationRepository, 'findOneByAddress')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      await reputationService.decreaseReputation(
        chainId,
        address,
        ReputationEntityType.REPUTATION_ORACLE,
      );

      expect(reputationRepository.findOneByAddress).toHaveBeenCalledWith(
        address,
      );
      expect(reputationEntity.reputationPoints).toBe(701);
      expect(reputationRepository.updateOne).toHaveBeenCalledTimes(0);
    });
  });

  describe('getReputationLevel', () => {
    it('should return LOW if reputation points are less than 300', () => {
      expect(reputationService.getReputationLevel(299)).toBe(
        ReputationLevel.LOW,
      );
    });
    it('should return MEDIUM if reputation points are less than 700', () => {
      expect(reputationService.getReputationLevel(699)).toBe(
        ReputationLevel.MEDIUM,
      );
    });

    it('should return HIGH if reputation points are greater than 700', () => {
      expect(reputationService.getReputationLevel(701)).toBe(
        ReputationLevel.HIGH,
      );
    });
  });

  describe('getReputation', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;

    it('should return HIGH reputation for Reputation Oracle Address', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        chainId,
        address,
        reputationPoints: 1,
        type: ReputationEntityType.RECORDING_ORACLE,
      };

      jest
        .spyOn(reputationRepository, 'findOneByAddressAndChainId')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      const result = await reputationService.getReputation(chainId, address);

      const resultReputation = {
        chainId,
        address,
        reputation: ReputationLevel.HIGH,
        role: ReputationEntityType.REPUTATION_ORACLE,
      };

      expect(result).toEqual(resultReputation);
    });

    it('should return reputation entity', async () => {
      const NOT_ORACLE_ADDRESS = '0x0000000000000000000000000000000000000000';
      const reputationEntity: Partial<ReputationEntity> = {
        chainId,
        address: NOT_ORACLE_ADDRESS,
        reputationPoints: 1,
        type: ReputationEntityType.RECORDING_ORACLE,
      };

      jest
        .spyOn(reputationRepository, 'findOneByAddressAndChainId')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      const result = await reputationService.getReputation(
        chainId,
        NOT_ORACLE_ADDRESS,
      );

      const resultReputation = {
        chainId,
        address: NOT_ORACLE_ADDRESS,
        reputation: ReputationLevel.LOW,
        role: ReputationEntityType.RECORDING_ORACLE,
      };

      expect(
        reputationRepository.findOneByAddressAndChainId,
      ).toHaveBeenCalledWith(NOT_ORACLE_ADDRESS, chainId);

      expect(result).toEqual(resultReputation);
    });

    it('should handle reputation not found', async () => {
      const NOT_ORACLE_ADDRESS = '0x0000000000000000000000000000000000000000';
      jest
        .spyOn(reputationRepository, 'findOneByAddressAndChainId')
        .mockResolvedValueOnce(null);

      await expect(
        reputationService.getReputation(chainId, NOT_ORACLE_ADDRESS),
      ).rejects.toThrow(
        new ReputationError(ReputationErrorMessage.NOT_FOUND, chainId, address),
      );
    });
  });

  describe('getReputations', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;

    it('should return all reputations', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        chainId,
        address,
        reputationPoints: 1,
        type: ReputationEntityType.RECORDING_ORACLE,
      };

      jest
        .spyOn(reputationRepository, 'findByChainIdAndTypes')
        .mockResolvedValueOnce([reputationEntity as ReputationEntity]);

      const result = await reputationService.getReputations();

      const resultReputation = {
        chainId,
        address,
        reputation: ReputationLevel.LOW,
        role: ReputationEntityType.RECORDING_ORACLE,
      };

      expect(reputationRepository.findByChainIdAndTypes).toHaveBeenCalled();
      expect(result).toEqual([resultReputation]);
    });
  });
});
