import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { KycConfigService } from '../../config/kyc-config.service';
import { KycController } from './kyc.controller';
import { KycSessionDto } from './kyc.dto';
import { KycService } from './kyc.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import { MOCK_ADDRESS, mockConfig } from '../../../test/constants';

describe('KycController', () => {
  let kycController: KycController;
  let kycService: KycService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: KycService,
          useValue: {
            initSession: jest.fn(),
            updateKycStatus: jest.fn(),
          },
        },
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
        {
          provide: Web3ConfigService,
          useValue: {
            operatorAddress: MOCK_ADDRESS,
          },
        },
        KycConfigService,
      ],
      controllers: [KycController],
    }).compile();

    kycService = moduleRef.get<KycService>(KycService);
    kycController = moduleRef.get<KycController>(KycController);
  });

  describe('startKyc', () => {
    it('should call service for authorized user', async () => {
      const session: KycSessionDto = {
        url: 'https://example.test',
      };

      jest.spyOn(kycService, 'initSession').mockResolvedValueOnce(session);

      expect(
        await kycController.startKyc({
          user: {
            email: 'test@example.com',
          },
        } as any),
      ).toEqual(session);
    });
  });

  describe('updateKycStatus', () => {
    it('should call service', async () => {
      kycService.updateKycStatus = jest.fn();

      await kycController.updateKycStatus({
        status: 'success',
        verification: {},
        technicalData: {},
      } as any);

      expect(kycService.updateKycStatus).toHaveBeenCalledWith({
        status: 'success',
        verification: {},
        technicalData: {},
      });
    });
  });

  describe('updateKycStatus', () => {
    it('should call service', async () => {
      kycService.getSignedAddress = jest.fn();
      await kycController.getSignedAddress({
        user: { evmAddress: '0x123' },
      } as any);

      expect(kycService.getSignedAddress).toHaveBeenCalledWith({
        evmAddress: '0x123',
      });
    });
  });
});
