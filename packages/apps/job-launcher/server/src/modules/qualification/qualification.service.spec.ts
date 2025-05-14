jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreUtils: {
    get: jest.fn(),
  },
}));

import { ChainId, KVStoreUtils } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import {
  MOCK_REPUTATION_ORACLE_URL,
  MOCK_WEB3_RPC_URL,
  mockConfig,
} from '../../../test/constants';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ErrorQualification, ErrorWeb3 } from '../../common/constants/errors';
import { ServerError, ValidationError } from '../../common/errors';
import { Web3Service } from '../web3/web3.service';
import { QualificationService } from './qualification.service';

describe.only('QualificationService', () => {
  let qualificationService: QualificationService, httpService: HttpService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
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
        QualificationService,
        Web3ConfigService,
        Web3Service,
        NetworkConfigService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(NetworkConfigService)
      .useValue({
        networks: [
          {
            chainId: ChainId.LOCALHOST,
            rpcUrl: MOCK_WEB3_RPC_URL,
          },
        ],
      })
      .compile();

    qualificationService =
      moduleRef.get<QualificationService>(QualificationService);

    httpService = moduleRef.get<HttpService>(HttpService);
  });

  describe('getQualifications', () => {
    it('should return a list of qualifications', async () => {
      (KVStoreUtils.get as any).mockResolvedValue(MOCK_REPUTATION_ORACLE_URL);

      const qualifications = [
        {
          reference: 'ref1',
          title: 'title1',
          description: 'desc1',
          expiresAt: null,
        },
      ];

      jest.spyOn(httpService, 'get').mockImplementation(
        () =>
          of({
            data: qualifications,
          }) as any,
      );

      const result = await qualificationService.getQualifications(
        ChainId.LOCALHOST,
      );

      expect(result).toEqual(qualifications);
    });

    it('should throw a ServerError when KVStoreUtils.get fails', async () => {
      (KVStoreUtils.get as any).mockRejectedValue(new Error('KV store error'));

      await expect(
        qualificationService.getQualifications(ChainId.LOCALHOST),
      ).rejects.toThrow(new ServerError(ErrorWeb3.ReputationOracleUrlNotSet));
    });

    it('should throw a ServerError when HTTP request fails', async () => {
      (KVStoreUtils.get as any).mockResolvedValue(MOCK_REPUTATION_ORACLE_URL);

      jest
        .spyOn(httpService, 'get')
        .mockImplementation(
          () => throwError(() => new Error('HTTP error')) as any,
        );

      await expect(
        qualificationService.getQualifications(ChainId.LOCALHOST),
      ).rejects.toThrow(
        new ServerError(ErrorQualification.FailedToFetchQualifications),
      );
    });

    it('should throw a ValidationError when invalid chainId', async () => {
      (KVStoreUtils.get as any).mockResolvedValue(MOCK_REPUTATION_ORACLE_URL);

      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(new Error('HTTP error')) as any);

      await expect(
        qualificationService.getQualifications(ChainId.MAINNET),
      ).rejects.toThrow(new ValidationError(ErrorWeb3.InvalidChainId));
    });
  });
});
