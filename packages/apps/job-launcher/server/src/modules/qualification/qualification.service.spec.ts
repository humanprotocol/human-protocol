import { Test } from '@nestjs/testing';
import { QualificationService } from './qualification.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';
import {
  MOCK_REPUTATION_ORACLE_URL,
  MOCK_WEB3_RPC_URL,
} from '../../../test/constants';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorQualification, ErrorWeb3 } from '../../common/constants/errors';
import { HttpStatus } from '@nestjs/common';
import { NetworkConfigService } from '../../common/config/network-config.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreUtils: {
    get: jest.fn(),
  },
}));

describe.only('QualificationService', () => {
  let qualificationService: QualificationService, httpService: HttpService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        QualificationService,
        ConfigService,
        Web3ConfigService,
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

      const result = await qualificationService.getQualifications();

      expect(result).toEqual(qualifications);
    });

    it('should throw a ControlledError when KVStoreUtils.get fails', async () => {
      (KVStoreUtils.get as any).mockRejectedValue(new Error('KV store error'));

      await expect(qualificationService.getQualifications()).rejects.toThrow(
        new ControlledError(
          ErrorWeb3.ReputationOracleUrlNotSet,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw a ControlledError when HTTP request fails', async () => {
      (KVStoreUtils.get as any).mockResolvedValue(MOCK_REPUTATION_ORACLE_URL);

      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() => throwError(new Error('HTTP error')) as any);

      await expect(qualificationService.getQualifications()).rejects.toThrow(
        new ControlledError(
          ErrorQualification.FailedToFetchQualifications,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
