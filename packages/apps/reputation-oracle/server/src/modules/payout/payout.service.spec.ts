import { Test } from '@nestjs/testing';
import { ChainId } from '@human-protocol/sdk';
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
import { ConfigModule, registerAs } from '@nestjs/config';
import { Web3Service } from '../web3/web3.service';
import { StorageService } from '../storage/storage.service';
import { PayoutService } from './payout.service';
import { createMock } from '@golevelup/ts-jest';
import { CvatManifestDto } from '../../common/dto/manifest';
import { ErrorResults } from '../../common/constants/errors';
import { CvatAnnotationMeta } from 'src/common/dto/result';

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
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
    payoutService = moduleRef.get<PayoutService>(PayoutService);
    payoutService.createPayoutSpecificActions = {
      [JobRequestType.FORTUNE]: {
        calculateResults: jest.fn(),
      },
      [JobRequestType.IMAGE_BOXES]: {
        calculateResults: jest.fn(),
      },
      [JobRequestType.IMAGE_POINTS]: {
        calculateResults: jest.fn(),
      },
      [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
        calculateResults: jest.fn(),
      },
      [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
        calculateResults: jest.fn(),
      },
    };
  });

  describe('executePayouts', () => {
    it('should successfully performs payouts for Fortune', async () => {
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

      const processing_results = {
        recipients: [MOCK_ADDRESS],
        amounts: [1n],
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
      };

      payoutService.createPayoutSpecificActions[JobRequestType.IMAGE_BOXES][
        'calculateResults'
      ] = jest.fn().mockResolvedValue(processing_results);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const resultsUrl = await payoutService.executePayouts(
        chainId,
        escrowAddress,
      );
      expect(resultsUrl).toEqual(processing_results.url);
    });

    it('should successfully performs payouts for CVAT', async () => {
      const manifest = {
        submissionsRequired: 1,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      jest.spyOn(storageService, 'download').mockResolvedValue(manifest);

      const processing_results = {
        recipients: [MOCK_ADDRESS],
        amounts: [1n],
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
      };

      payoutService.createPayoutSpecificActions[JobRequestType.FORTUNE][
        'calculateResults'
      ] = jest.fn().mockResolvedValue(processing_results);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const resultsUrl = await payoutService.executePayouts(
        chainId,
        escrowAddress,
      );
      expect(resultsUrl).toEqual(processing_results.url);
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

      const results: CvatAnnotationMeta = {
        jobs: [
          {
            job_id: 1,
            final_result_id: 3,
          },
        ],
        results: [
          {
            id: 2,
            job_id: 1,
            annotator_wallet_address: MOCK_ADDRESS,
            annotation_quality: 0.6,
          },
          {
            id: 3,
            job_id: 1,
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
      });
      expect(result.recipients.length).toEqual(1);
      expect(result.amounts.length).toEqual(1);
    });
  });
});
