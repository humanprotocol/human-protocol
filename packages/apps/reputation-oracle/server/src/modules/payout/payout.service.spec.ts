import { createMock } from '@golevelup/ts-jest';
import { ConfigModule, registerAs } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
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
import { Web3Service } from '../web3/web3.service';
import { StorageService } from '../storage/storage.service';
import { PayoutService } from './payout.service';
import { CvatManifestDto } from '../../common/dto/manifest';
import { ErrorManifest, ErrorResults } from '../../common/constants/errors';
import { CvatAnnotationMeta } from '../../common/dto/result';
import { CalculatedPayout, SaveResultDto } from './payout.interface';
import { ControlledError } from '../../common/errors/controlled';

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
        calculatePayouts: jest.fn(),
        saveResults: jest.fn(),
      },
      [JobRequestType.IMAGE_BOXES]: {
        calculatePayouts: jest.fn(),
        saveResults: jest.fn(),
      },
      [JobRequestType.IMAGE_POINTS]: {
        calculatePayouts: jest.fn(),
        saveResults: jest.fn(),
      },
      [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
        calculatePayouts: jest.fn(),
        saveResults: jest.fn(),
      },
      [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
        calculatePayouts: jest.fn(),
        saveResults: jest.fn(),
      },
      [JobRequestType.IMAGE_POLYGONS]: {
        calculatePayouts: jest.fn(),
        saveResults: jest.fn(),
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processResults', () => {
    const results: SaveResultDto = {
      url: MOCK_FILE_URL,
      hash: MOCK_FILE_HASH,
    };

    beforeEach(() => {
      EscrowClient.build = jest.fn().mockResolvedValue({
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      });

      payoutService.createPayoutSpecificActions[JobRequestType.IMAGE_BOXES][
        'saveResults'
      ] = jest.fn().mockResolvedValue(results);
    });

    it('should successfully save results for CVAT', async () => {
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

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(manifest);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const result = await payoutService.processResults(chainId, escrowAddress);
      expect(result).toEqual(results);
    });

    it('should successfully save results for Fortune', async () => {
      const manifest = {
        submissionsRequired: 1,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(manifest);

      const results: SaveResultDto = {
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
      };

      payoutService.createPayoutSpecificActions[JobRequestType.FORTUNE][
        'saveResults'
      ] = jest.fn().mockResolvedValue(results);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const result = await payoutService.processResults(chainId, escrowAddress);
      expect(result).toEqual(results);
    });

    it('should throw an error if the manifest url does not exist', async () => {
      EscrowClient.build = jest.fn().mockResolvedValue({
        getManifestUrl: jest.fn().mockResolvedValue(null),
      });

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      await expect(
        payoutService.processResults(chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(
          ErrorManifest.ManifestUrlDoesNotExist,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw an error for unsupported request types', async () => {
      const mockManifest = { requestType: 'unsupportedType' };

      jest.spyOn(EscrowClient, 'build').mockResolvedValue({
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      } as any);

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(mockManifest);

      await expect(
        payoutService.processResults(ChainId.LOCALHOST, MOCK_ADDRESS),
      ).rejects.toThrow(
        `Unsupported request type: ${mockManifest.requestType.toLowerCase()}`,
      );
    });
  });

  describe('calculatePayouts', () => {
    const results: CalculatedPayout[] = [
      {
        address: MOCK_ADDRESS,
        amount: 1n,
      },
    ];
    let escrowClientMock: any;

    beforeEach(() => {
      escrowClientMock = {
        getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      };
      EscrowClient.build = jest.fn().mockImplementation(() => escrowClientMock);

      payoutService.createPayoutSpecificActions[JobRequestType.IMAGE_BOXES][
        'calculatePayouts'
      ] = jest.fn().mockResolvedValue(results);
    });

    it('should successfully calculate payouts for CVAT', async () => {
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

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(manifest);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const payouts = await payoutService.calculatePayouts(
        chainId,
        escrowAddress,
        MOCK_FILE_URL,
      );

      expect(payouts).toEqual(results);

      expect(escrowClientMock.getManifestUrl).toHaveBeenCalledTimes(1);
    });

    it('should successfully performs payouts for Fortune', async () => {
      const manifest = {
        submissionsRequired: 1,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(manifest);

      const results: CalculatedPayout[] = [
        {
          address: MOCK_ADDRESS,
          amount: 1n,
        },
      ];

      payoutService.createPayoutSpecificActions[JobRequestType.FORTUNE][
        'calculatePayouts'
      ] = jest.fn().mockResolvedValue(results);

      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const payouts = await payoutService.calculatePayouts(
        chainId,
        escrowAddress,
        MOCK_FILE_URL,
      );

      expect(payouts).toEqual(results);

      expect(escrowClientMock.getManifestUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveResultsFortune', () => {
    beforeEach(() => {
      EscrowClient.build = jest.fn().mockResolvedValue({
        getIntermediateResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      });
    });

    it('should successfully save results values', async () => {
      const chainId = ChainId.LOCALHOST;
      const escrowAddress = MOCK_ADDRESS;

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
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(intermediateResults);

      jest.spyOn(storageService, 'uploadJobSolutions').mockResolvedValue({
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
      });

      const result = await payoutService.saveResultsFortune(
        manifest,
        chainId,
        escrowAddress,
      );
      expect(result.url).toEqual(expect.any(String));
      expect(result.hash).toEqual(expect.any(String));
    });

    it('should throw an error if no intermediate results found', async () => {
      const chainId = ChainId.LOCALHOST;
      const escrowAddress = MOCK_ADDRESS;

      const manifest = {
        submissionsRequired: 2,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue([] as any);

      await expect(
        payoutService.saveResultsFortune(manifest, chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(
          ErrorResults.NoIntermediateResultsFound,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw an error if the number of solutions is less than solutions required', async () => {
      const chainId = ChainId.LOCALHOST;
      const escrowAddress = MOCK_ADDRESS;

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
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(intermediateResults);

      await expect(
        payoutService.saveResultsFortune(manifest, chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(
          ErrorResults.NotAllRequiredSolutionsHaveBeenSent,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('calculatePayoutsFortune', () => {
    it('should successfully calculate results and return correct result values', async () => {
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
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(intermediateResults);

      const result = await payoutService.calculatePayoutsFortune(
        manifest,
        MOCK_FILE_URL,
      );
      expect(result).toEqual(expect.any(Array));
    });
  });

  describe('saveResultsCvat', () => {
    beforeEach(() => {
      EscrowClient.build = jest.fn().mockResolvedValue({
        getIntermediateResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      });
    });

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

      jest.spyOn(storageService, 'copyFileFromURLToBucket').mockResolvedValue({
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
      });
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(results);

      const result = await payoutService.saveResultsCvat(
        chainId,
        escrowAddress,
      );
      expect(result.url).toEqual(expect.any(String));
      expect(result.hash).toEqual(expect.any(String));
    });
  });

  describe('calculatePayoutsCvat', () => {
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

    beforeEach(() => {
      EscrowClient.build = jest.fn().mockResolvedValue({
        getIntermediateResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      });
    });

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

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(results);

      const result = await payoutService.calculatePayoutsCvat(
        manifest as any,
        chainId,
        escrowAddress,
      );
      expect(result.length).toEqual(1);
    });

    it('should throw an error if no annotations meta found', async () => {
      const escrowAddress = MOCK_ADDRESS;
      const chainId = ChainId.LOCALHOST;

      const results: CvatAnnotationMeta = {
        jobs: [],
        results: [],
      };

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(results);

      await expect(
        payoutService.calculatePayoutsCvat(
          manifest as any,
          chainId,
          escrowAddress,
        ),
      ).rejects.toThrow(
        new ControlledError(
          ErrorResults.NoAnnotationsMetaFound,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
