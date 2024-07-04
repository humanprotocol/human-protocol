import { Test } from '@nestjs/testing';

import { KycStatus } from '../../common/enums/user';
import { KycController } from './kyc.controller';
import { KycSessionDto } from './kyc.dto';
import { KycService } from './kyc.service';

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
    }).compile();

    kycService = moduleRef.get<KycService>(KycService);
    kycController = moduleRef.get<KycController>(KycController);
  });

  describe('startKyc', () => {
    it('should call service for authorized user', async () => {
      const session: KycSessionDto = {
        sessionId: '123',
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

      await kycController.updateKycStatus(
        {
          secret: 'secret',
        },
        {
          session_id: '123',
          state: KycStatus.APPROVED,
        } as any,
      );

      expect(kycService.updateKycStatus).toHaveBeenCalledWith('secret', {
        session_id: '123',
        state: KycStatus.APPROVED,
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
