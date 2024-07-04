import { Test } from '@nestjs/testing';

import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycSessionDto } from './kyc.dto';
import { KycStatus } from '../../common/enums/user';
import { Web3Service } from '../web3/web3.service';
import { MOCK_ADDRESS } from '../../../test/constants';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { ConfigService } from '@nestjs/config';
import { ChainId } from '@human-protocol/sdk';

describe('KycController', () => {
  let kycController: KycController;
  let kycService: KycService;
  let web3Service: Web3Service;
  let networkConfigService: NetworkConfigService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    signMessage: jest.fn(),
  };

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
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        ConfigService,
        {
          provide: NetworkConfigService,
          useValue: {
            networks: [{ chainId: ChainId.LOCALHOST }],
          },
        },
      ],
      controllers: [KycController],
    }).compile();

    kycService = moduleRef.get<KycService>(KycService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    networkConfigService =
      moduleRef.get<NetworkConfigService>(NetworkConfigService);
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
    it('should call web3Service', async () => {
      await kycController.getSignedAddress({
        user: { evmAddress: '0x123' },
      } as any);

      expect(web3Service.getSigner).toHaveBeenCalledWith(
        networkConfigService.networks[0].chainId,
      );
    });
  });
});
