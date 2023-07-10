import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { Web3Service } from '../web3/web3.service';
import { JobService } from './job.service';
import {
  EscrowClient,
  KVStoreClient,
  StorageClient,
} from '@human-protocol/sdk';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  KVStoreClient: {
    build: jest.fn(),
  },
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
  },
}));

jest.mock('axios', () => ({
  post: jest.fn(),
}));

describe('JobService', () => {
  let jobService: JobService;
  let web3Service: Web3Service;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const httpServicePostMock = jest
    .fn()
    .mockReturnValue(of({ status: 200, data: {} }));

  beforeAll(async () => {
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
      const manifest = {
        title: 'Example Title',
        description: 'Example Description',
        fortunesRequested: 5,
        fundAmount: 100,
      };
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('https://example.com/manifest.json'),
      }));
      (StorageClient.downloadFileFromUrl as any).mockResolvedValue({
        ...manifest,
        fortunesRequired: manifest.fortunesRequested,
      });

      const result = await jobService.getDetails(chainId, escrowAddress);

      expect(result).toEqual({
        escrowAddress,
        chainId,
        manifest,
      });
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if the escrow address is invalid', async () => {
      const escrowAddress = 'invalid_address';
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockRejectedValue(new Error('Invalid address')),
      }));

      await expect(
        jobService.getDetails(chainId, escrowAddress),
      ).rejects.toThrow('Invalid address');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if the file does not exist', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest
          .fn()
          .mockResolvedValue('https://example.com/manifest.json'),
      }));
      (StorageClient.downloadFileFromUrl as any).mockRejectedValue(
        new Error('File not found'),
      );

      await expect(
        jobService.getDetails(chainId, escrowAddress),
      ).rejects.toThrow('File not found');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });

  describe('getPendingJobs', () => {
    it('should return an array of pending jobs', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getEscrowsFiltered: jest
          .fn()
          .mockResolvedValue([
            '0x1234567890123456789012345678901234567893',
            '0x1234567890123456789012345678901234567894',
          ]),
      }));

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual([
        '0x1234567890123456789012345678901234567893',
        '0x1234567890123456789012345678901234567894',
      ]);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should return an array of pending jobs removing jobs already submitted by worker', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getEscrowsFiltered: jest
          .fn()
          .mockResolvedValue([
            '0x1234567890123456789012345678901234567893',
            '0x1234567890123456789012345678901234567894',
          ]),
      }));

      jobService['storage']['0x1234567890123456789012345678901234567893'] = [
        workerAddress,
      ];

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual(['0x1234567890123456789012345678901234567894']);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should return an empty array if there are no pending jobs', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getEscrowsFiltered: jest.fn().mockResolvedValue([]),
      }));

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual([]);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });

  describe('solveJob', () => {
    it('should solve a job', async () => {
      const solution = 'job-solution';

      const recordingOracleURLMock = 'https://example.com/recordingoracle';

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(recordingOracleURLMock),
      }));

      const result = await jobService.solveJob(
        chainId,
        escrowAddress,
        workerAddress,
        solution,
      );

      expect(result).toBe(true);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
      expect(httpServicePostMock).toHaveBeenCalledWith(
        recordingOracleURLMock + '/job/solve',
        expect.objectContaining({
          escrowAddress,
          chainId,
          exchangeAddress: signerMock.address,
          workerAddress,
          solution,
        }),
      );
    });

    it('should fail if the escrow address is invalid', async () => {
      const escrowAddress = 'invalid_address';
      const solution = 'job-solution';
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockRejectedValue(new Error('Invalid address')),
      }));

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('Invalid address');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if recording oracle url is empty', async () => {
      const solution = 'job-solution';

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(''),
      }));

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('Unable to get Recording Oracle URL');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should fail if user has already submitted a solution', async () => {
      const solution = 'job-solution';

      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567893'),
      }));
      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue('https://example.com/recordingoracle'),
      }));

      jobService['storage'][escrowAddress] = [workerAddress];

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('User has already submitted a solution');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });
});
