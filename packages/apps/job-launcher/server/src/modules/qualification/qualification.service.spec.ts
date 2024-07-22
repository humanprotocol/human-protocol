import { Test } from '@nestjs/testing';
import { QualificationService } from './qualification.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

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
  });
});
