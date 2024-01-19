import { Test } from '@nestjs/testing';

import { KYCController } from './kyc.controller';
import { KYCService } from './kyc.service';
import { KYCSessionDto } from './kyc.dto';
import { KYCStatus } from '../../common/enums/user';

describe('KYCController', () => {
  let kycController: KYCController;
  let kycService: KYCService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: KYCService,
          useValue: {
            initSession: jest.fn(),
            updateKYCStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    kycService = moduleRef.get<KYCService>(KYCService);
    kycController = new KYCController(kycService);
  });

  describe('startKYC', () => {
    it('should call service for authorized user', async () => {
      const session: KYCSessionDto = {
        sessionId: '123',
      };

      jest.spyOn(kycService, 'initSession').mockResolvedValueOnce(session);

      expect(
        await kycController.startKYC({
          user: {
            email: 'test@example.com',
          },
        } as any),
      ).toEqual(session);
    });
  });

  describe('updateKYCStatus', () => {
    it('should call service', async () => {
      kycService.updateKYCStatus = jest.fn();

      await kycController.updateKYCStatus(
        {
          secret: 'secret',
        },
        {
          session_id: '123',
          state: KYCStatus.APPROVED,
        } as any,
      );

      expect(kycService.updateKYCStatus).toHaveBeenCalledWith('secret', {
        session_id: '123',
        state: KYCStatus.APPROVED,
      });
    });
  });
});
