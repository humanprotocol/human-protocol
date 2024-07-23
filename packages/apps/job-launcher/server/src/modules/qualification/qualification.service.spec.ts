import { Test } from '@nestjs/testing';
import { QualificationService } from './qualification.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { KVStoreUtils } from '@human-protocol/sdk';
import { MOCK_REPUTATION_ORACLE_URL } from '../../../test/constants';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorQualification, ErrorWeb3 } from '../../common/constants/errors';
import { HttpStatus } from '@nestjs/common';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreUtils: {
    getKVStoreData: jest.fn(),
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
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    qualificationService =
      moduleRef.get<QualificationService>(QualificationService);

    httpService = moduleRef.get<HttpService>(HttpService);
  });

  describe('getQualifications', () => {
    it('should return a list of qualifications', async () => {
      (KVStoreUtils.getKVStoreData as any).mockResolvedValue([
        { key: 'url', value: MOCK_REPUTATION_ORACLE_URL },
      ]);

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

    it('should throw a ControlledError when KVStoreUtils.getKVStoreData fails', async () => {
      (KVStoreUtils.getKVStoreData as any).mockRejectedValue(
        new Error('KV store error'),
      );

      await expect(qualificationService.getQualifications()).rejects.toThrow(
        new ControlledError(
          ErrorQualification.FailedToFetchQualifications,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw a ControlledError when reputation oracle URL is not set', async () => {
      (KVStoreUtils.getKVStoreData as any).mockResolvedValue([]);

      await expect(qualificationService.getQualifications()).rejects.toThrow(
        new ControlledError(
          ErrorWeb3.ReputationOracleUrlNotSet,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw a ControlledError when HTTP request fails', async () => {
      (KVStoreUtils.getKVStoreData as any).mockResolvedValue([
        { key: 'url', value: MOCK_REPUTATION_ORACLE_URL },
      ]);

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
