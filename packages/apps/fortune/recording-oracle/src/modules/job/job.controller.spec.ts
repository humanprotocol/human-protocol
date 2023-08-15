import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';

import { JobController } from './job.controller';
import { JobService } from './job.service';
import { Web3Service } from '../web3/web3.service';
import {
  MOCK_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
  MOCK_FILE_URL,
  MOCK_HOST,
  MOCK_PORT,
  MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  MOCK_WEB3_PRIVATE_KEY,
} from '../../../test/constants';
import { ChainId } from '@human-protocol/sdk';
import { JobRequestType } from '@/common/enums/job';

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
          registerAs('server', () => ({
            reputationOracleWebhookUrl: MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
          })),
        ),
      ],
      providers: [
        JobService,
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

      expect(
        await jobController.solve({
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
          exchangeAddress: MOCK_ADDRESS,
          workerAddress: MOCK_ADDRESS,
          solution: 'Solution',
        }),
      ).toBe('OK');
    });
  });
});
