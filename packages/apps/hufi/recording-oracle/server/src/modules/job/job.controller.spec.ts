import { HttpService } from '@nestjs/axios';
import { ConfigModule, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';

import { ChainId } from '@human-protocol/sdk';
import {
  MOCK_ADDRESS,
  MOCK_FILE_URL,
  MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  MOCK_SIGNATURE,
  MOCK_WEB3_PRIVATE_KEY,
} from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { StorageService } from '../storage/storage.service';
import { verifySignature } from '../../common/utils/signature';

jest.mock('../../common/utils/signature');

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StorageClient: jest.fn().mockImplementation(() => ({})),
}));

const signerMock = {
  address: MOCK_ADDRESS,
  getAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
};

const httpServicePostMock = jest
  .fn()
  .mockReturnValue(of({ status: 200, data: {} }));

describe('JobController', () => {
  let jobController: JobController;
  let jobService: JobService;

  beforeAll(async () => {
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
        ConfigModule.forFeature(
          registerAs('web3', () => ({
            web3PrivateKey: MOCK_WEB3_PRIVATE_KEY,
          })),
        ),
        ConfigModule.forFeature(
          registerAs('server', () => ({
            reputationOracleWebhookUrl: MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
          })),
        ),
      ],
      providers: [
        JobService,
        StorageService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: httpServicePostMock,
          },
        },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    jobController = new JobController(jobService);
  });

  describe('solve', () => {
    it('should call service', async () => {
      jest
        .spyOn(jobService, 'processJobSolution')
        .mockImplementation(async () => 'OK');

      (verifySignature as jest.Mock).mockReturnValue(true);

      expect(
        await jobController.solve(MOCK_SIGNATURE, {
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
          solutionsUrl: MOCK_FILE_URL,
        }),
      ).toBe('OK');
    });
  });
});
