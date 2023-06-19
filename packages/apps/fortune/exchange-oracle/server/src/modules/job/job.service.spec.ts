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
  EscrowClient: jest.fn(),
  KVStoreClient: jest.fn(),
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

  const signerMock = {
    address: '0x1234567890123456789012345678901234567890',
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
      const chainId = 1;
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const manifest = {
        title: 'Example Title',
        description: 'Example Description',
        fortunesRequested: 5,
        fundAmount: 100,
      };
      (EscrowClient as any).mockImplementation(() => ({
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
      const chainId = 1;
      const escrowAddress = 'invalid_address';
      (EscrowClient as any).mockImplementation(() => ({
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
      const chainId = 1;
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      (EscrowClient as any).mockImplementation(() => ({
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
      (EscrowClient as any).mockImplementation(() => ({
        getEscrowsFiltered: jest
          .fn()
          .mockResolvedValue([
            '0x1234567890123456789012345678901234567891',
            '0x1234567890123456789012345678901234567892',
          ]),
      }));
      const chainId = 1;
      const workerAddress = '0x1234567890123456789012345678901234567893';

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual([
        '0x1234567890123456789012345678901234567891',
        '0x1234567890123456789012345678901234567892',
      ]);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should return an array of pending jobs removing jobs already submitted by worker', async () => {
      (EscrowClient as any).mockImplementation(() => ({
        getEscrowsFiltered: jest
          .fn()
          .mockResolvedValue([
            '0x1234567890123456789012345678901234567891',
            '0x1234567890123456789012345678901234567892',
          ]),
      }));
      const chainId = 1;
      const workerAddress = '0x1234567890123456789012345678901234567893';

      jobService['storage']['0x1234567890123456789012345678901234567891'] = [
        workerAddress,
      ];

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual(['0x1234567890123456789012345678901234567892']);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should return an empty array if there are no pending jobs', async () => {
      (EscrowClient as any).mockImplementation(() => ({
        getEscrowsFiltered: jest
          .fn()
          .mockResolvedValue([
            '0x1234567890123456789012345678901234567891',
            '0x1234567890123456789012345678901234567892',
          ]),
      }));
      const chainId = 1;
      const workerAddress = '0x1234567890123456789012345678901234567893';

      jobService['storage']['0x1234567890123456789012345678901234567891'] = [
        workerAddress,
      ];

      const result = await jobService.getPendingJobs(chainId, workerAddress);

      expect(result).toEqual(['0x1234567890123456789012345678901234567892']);
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });
  });

  describe('solveJob', () => {
    it('should solve a job', async () => {
      const chainId = 1;
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'job-solution';

      const recordingOracleURLMock = 'https://example.com/recordingoracle';

      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567892'),
      }));
      (KVStoreClient as any).mockImplementation(() => ({
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
      const chainId = 1;
      const escrowAddress = 'invalid_address';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'job-solution';
      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockRejectedValue(new Error('Invalid address')),
      }));

      await expect(
        jobService.solveJob(chainId, escrowAddress, workerAddress, solution),
      ).rejects.toThrow('Invalid address');
      expect(web3Service.getSigner).toHaveBeenCalledWith(chainId);
    });

    it('should call localhost recording oracle if empty kvstore value', async () => {
      const chainId = 1;
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'job-solution';

      (EscrowClient as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue('0x1234567890123456789012345678901234567892'),
      }));
      (KVStoreClient as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(''),
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
        'http://localhost:3005/job/solve',
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
