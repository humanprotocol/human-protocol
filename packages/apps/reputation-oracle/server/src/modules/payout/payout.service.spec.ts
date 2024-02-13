import { Test } from '@nestjs/testing';
import { ChainId, EscrowClient } from '@human-protocol/sdk';
import {
  MOCK_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import { JobRequestType } from '../../common/enums';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { Web3Service } from '../web3/web3.service';
import { StorageService } from '../storage/storage.service';
import { PayoutService } from './payout.service';
import { ErrorManifest, ErrorResults } from '../../common/constants/errors';
import { createMock } from '@golevelup/ts-jest';
import { CvatManifestDto } from 'src/common/dto/manifest';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      getIntermediateResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      bulkPayOut: jest.fn().mockResolvedValue(true),
    })),
  },
}));

describe('PayoutService', () => {
  let payoutService: PayoutService, storageService: StorageService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case ConfigNames.REPUTATION_LEVEL_LOW:
            return 300;
          case ConfigNames.REPUTATION_LEVEL_HIGH:
            return 700;
        }
      }),
    };

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
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn().mockReturnValue(new Error()),
            calculateGasPrice: jest.fn().mockReturnValue(1000n),
          },
        },
        { provide: StorageService, useValue: createMock<StorageService>() },
        PayoutService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
    payoutService = moduleRef.get<PayoutService>(PayoutService);
  });

  describe('executePayouts', () => {
    it('should successfully performs payouts', async () => {
      const processing_results = {
        recipients: [MOCK_ADDRESS],
        amounts: [1n],
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
        checkPassed: true,
      };

      jest
        .spyOn(payoutService, 'calculateResults')
        .mockResolvedValue(processing_results);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const result = await payoutService.executePayouts(chainId, escrowAddress);
      expect(result.url).toEqual(processing_results.url);
      expect(result.checkPassed).toEqual(processing_results.checkPassed);
    });
  });

  describe('calculateResults', () => {
    it('should successfully calculate results for Fortune', async () => {
      const manifest = {
        submissionsRequired: 1,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      jest.spyOn(storageService, 'download').mockResolvedValue(manifest);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const processing_results = {
        recipients: [MOCK_ADDRESS],
        amounts: [1n],
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
        checkPassed: true,
      };

      jest
        .spyOn(payoutService, 'processFortune')
        .mockResolvedValue(processing_results);

      const result = await payoutService.calculateResults(
        chainId,
        escrowAddress,
      );
      expect(result.recipients).toEqual(processing_results.recipients);
      expect(result.amounts).toEqual(processing_results.amounts);
      expect(result.checkPassed).toEqual(processing_results.checkPassed);
    });

    it('should successfully calculate results for CVAT', async () => {
      const manifest: CvatManifestDto = {
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

      jest.spyOn(storageService, 'download').mockResolvedValue(manifest);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const processing_results = {
        recipients: [MOCK_ADDRESS],
        amounts: [1n],
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
        checkPassed: true,
      };

      jest
        .spyOn(payoutService, 'processCvat')
        .mockResolvedValue(processing_results);

      const result = await payoutService.calculateResults(
        chainId,
        escrowAddress,
      );
      expect(result.recipients).toEqual(processing_results.recipients);
      expect(result.amounts).toEqual(processing_results.amounts);
      expect(result.checkPassed).toEqual(processing_results.checkPassed);
    });

    it('should throw an error if unsupported manifest type', async () => {
      const manifest: CvatManifestDto = {
        data: {
          data_url: MOCK_FILE_URL,
        },
        annotation: {
          labels: [{ name: 'cat' }, { name: 'dog' }],
          description: 'Description',
          type: 'OTHER_TYPE' as JobRequestType,
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

      jest.spyOn(storageService, 'download').mockResolvedValue(manifest);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const processing_results = {
        recipients: [MOCK_ADDRESS],
        amounts: [1n],
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
        checkPassed: true,
      };

      jest
        .spyOn(payoutService, 'processFortune')
        .mockResolvedValue(processing_results);

      await expect(
        payoutService.calculateResults(chainId, escrowAddress),
      ).rejects.toThrow(ErrorManifest.UnsupportedManifestType);
    });

    it('should throw an error if manifest url does not exist', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getIntermediateResultsUrl: jest.fn().mockResolvedValue(null),
        getManifestUrl: jest.fn().mockResolvedValue(null),
      }));

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      await expect(
        payoutService.calculateResults(chainId, escrowAddress),
      ).rejects.toThrow(ErrorManifest.ManifestUrlDoesNotExist);
    });
  });

  describe('processFortune', () => {
    it('should successfully process and return correct result values', async () => {
      const manifest = {
        submissionsRequired: 1,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      const intermediateResults = [
        {
          workerAddress: 'string',
          solution: 'string',
        },
      ];

      jest
        .spyOn(storageService, 'download')
        .mockResolvedValue(intermediateResults);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const result = await payoutService.processFortune(
        manifest,
        chainId,
        escrowAddress,
      );
      expect(result.recipients).toEqual(expect.any(Array));
      expect(result.amounts).toEqual(expect.any(Array));
      expect(result.checkPassed).toEqual(expect.any(Boolean));
    });

    it('should throw an error if the number of solutions is less than solutions required', async () => {
      const manifest = {
        submissionsRequired: 2,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      const intermediateResults = [
        {
          workerAddress: 'string',
          solution: 'string',
        },
      ];

      jest
        .spyOn(storageService, 'download')
        .mockResolvedValue(intermediateResults);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      await expect(
        payoutService.processFortune(manifest, chainId, escrowAddress),
      ).rejects.toThrow(ErrorResults.NotAllRequiredSolutionsHaveBeenSent);
    });
  });

  describe('processCvat', () => {
    const manifest = {
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

    it('should successfully process and return correct result values', async () => {
      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const results = {
        jobs: [
          {
            id: 1,
            job_id: 1,
            annotator_wallet_address: MOCK_ADDRESS,
            annotation_quality: 0.96,
          },
        ],
        results: [
          {
            id: 2,
            job_id: 2,
            annotator_wallet_address: MOCK_ADDRESS,
            annotation_quality: 0.96,
          },
        ],
      };

      jest.spyOn(storageService, 'download').mockResolvedValue(results);

      jest
        .spyOn(storageService, 'copyFileFromURLToBucket')
        .mockResolvedValue({ url: MOCK_FILE_URL, hash: MOCK_FILE_HASH });

      const result = await payoutService.processCvat(
        manifest as any,
        chainId,
        escrowAddress,
      );
      expect(result).toEqual({
        recipients: expect.any(Array),
        amounts: expect.any(Array),
        url: expect.any(String),
        hash: expect.any(String),
        checkPassed: true,
      });
    });
  });
});
