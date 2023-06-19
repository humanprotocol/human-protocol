import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { Web3Service } from '../web3/web3.service';
import { JobService } from './job.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: jest.fn().mockImplementation(() => ({
    getManifestUrl: jest
      .fn()
      .mockResolvedValue('https://example.com/manifest.json'),
    getEscrowsFiltered: jest
      .fn()
      .mockResolvedValue(['0xescrowaddress1', '0xescrowaddress2']),
    getRecordingOracleAddress: jest
      .fn()
      .mockResolvedValue('0xrecordingoracleaddress'),
  })),
  StorageClient: {
    downloadFileFromUrl: jest.fn().mockResolvedValue({
      title: 'Example Title',
      description: 'Example Description',
      fortunesRequired: 5,
      fundAmount: 100,
    }),
  },
  KVStoreClient: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue('https://example.com/recordingoracle'),
  })),
}));

jest.mock('axios', () => ({
  post: jest.fn(),
}));

describe('JobService', () => {
  let jobService: JobService;
  let web3Service: Web3Service;

  const signerMock = {
    address: '0xsigneraddress',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const httpServicePostMock = jest
    .fn()
    .mockReturnValue(of({ status: 200, data: {} }));

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
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
    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  describe('getDetails', () => {
    it('should return job details', async () => {
      const chainId = 1;
      const escrowAddress = '0xescrowaddress';

      const result = await jobService.getDetails(chainId, escrowAddress);

      expect(result).toEqual({
        escrowAddress,
        chainId,
        manifest: {
          title: 'Example Title',
          description: 'Example Description',
          fortunesRequested: 5,
          fundAmount: 100,
        },
      });
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });

  describe('getPendingJobs', () => {
    it('should return an array of pending jobs', async () => {
      const chainId = 1;
      const workerAddress = '0xworkeraddress';

      jobService['storage']['0xescrowaddress1'] = [workerAddress];

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual(['0xescrowaddress2']);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });

  describe('solveJob', () => {
    it('should solve a job', async () => {
      const chainId = 1;
      const escrowAddress = '0xescrowaddress';
      const workerAddress = '0xworkeraddress';
      const solution = 'job-solution';

      const recordingOracleURLMock = 'https://example.com/recordingoracle';

      const result = await jobService.solveJob(
        chainId,
        escrowAddress,
        workerAddress,
        solution,
      );

      expect(result).toBe(true);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
      expect(httpServicePostMock).toHaveBeenCalledWith(
        recordingOracleURLMock,
        expect.objectContaining({
          escrowAddress,
          chainId,
          exchangeAddress: signerMock.address,
          workerAddress,
          solution,
        }),
      );
    });
  });
});
