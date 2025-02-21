import { Test } from '@nestjs/testing';

import { KycController } from './kyc.controller';
import { KycSessionDto } from './kyc.dto';
import { KycService } from './kyc.service';
import { EnvConfigModule } from '../../config/config.module';

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
      ],
      controllers: [KycController],
      imports: [EnvConfigModule],
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
