import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DeepPartial } from 'typeorm';
import {
  MOCK_ADDRESS,
  MOCK_FILE_URL,
  MOCK_MAX_RETRY_COUNT,
} from '../../../test/constants';
import { SynapsConfigService } from '../../common/config/synaps-config.service';
import { AbuseDecision, AbuseStatus } from '../../common/enums/abuse';
import { AbuseEntity } from './abuse.entity';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { Web3Service } from '../web3/web3.service';
import {
  ChainId,
  EscrowClient,
  OperatorUtils,
  StakingClient,
} from '@human-protocol/sdk';
import { of } from 'rxjs';
import { ErrorManifest, ErrorSlack } from '../../common/constants/errors';
import { ethers } from 'ethers';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
    })),
  },
  StakingClient: {
    build: jest.fn().mockImplementation(() => ({
      slash: jest.fn(),
    })),
  },
  OperatorUtils: {
    getLeader: jest.fn(),
  },
}));

describe('Abuse Service', () => {
  let abuseService: AbuseService;
  let httpService: HttpService;
  let abuseRepository: AbuseRepository;
  let slackConfigService: SlackConfigService;

  const escrowAddress = MOCK_ADDRESS,
    chainId = ChainId.LOCALHOST;

  beforeAll(async () => {
    const mockHttpService: DeepPartial<HttpService> = {
      post: jest.fn(),
    };
    const signerMock = {
      address: MOCK_ADDRESS,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AbuseService,
        ConfigService,
        ServerConfigService,
        SlackConfigService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: AbuseRepository, useValue: createMock<AbuseRepository>() },
      ],
    }).compile();

    httpService = moduleRef.get<HttpService>(HttpService);
    abuseService = moduleRef.get<AbuseService>(AbuseService);
    abuseRepository = moduleRef.get<AbuseRepository>(AbuseRepository);
    slackConfigService = moduleRef.get<SlackConfigService>(SlackConfigService);

    jest
      .spyOn(SynapsConfigService.prototype, 'apiKey', 'get')
      .mockReturnValue('test');
  });

  describe('createAbuse', () => {
    it('should create a new abuse entity', async () => {
      const userId = 1;
      const dto = {
        escrowAddress,
        chainId,
      };
      await abuseService.createAbuse(dto, userId);

      expect(abuseRepository.createUnique).toHaveBeenCalledWith({
        escrowAddress: escrowAddress,
        chainId: chainId,
        userId: userId,
        retriesCount: 0,
        status: AbuseStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });
  });

  describe('sendSlackNotification', () => {
    it('should send a notification to slack', async () => {
      const abuseEntity = {
        escrowAddress,
        chainId,
      };

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of({ status: 200, data: {} }) as any);

      await abuseService.sendSlackNotification(abuseEntity as any);

      expect(httpService.post).toHaveBeenCalledWith(
        slackConfigService.webhookUrl,
        expect.any(Object),
      );
    });

    it('should throw an error if escrow does not contain a valid manifest url', async () => {
      const abuseEntity = {
        escrowAddress,
        chainId,
      };

      (EscrowClient.build as any).mockImplementationOnce(() => ({
        getManifestUrl: jest.fn().mockResolvedValue(''),
      }));

      await expect(
        abuseService.sendSlackNotification(abuseEntity as any),
      ).rejects.toThrow(ErrorManifest.ManifestUrlDoesNotExist);
    });
  });

  describe('receiveSlackInteraction', () => {
    it('should send an Abuse Report Modal to slack if data type is interactive_message and the decision is accepted', async () => {
      const abuseEntity = {
        escrowAddress,
        chainId,
      };

      const dto = {
        callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.ACCEPTED }],
      };

      jest
        .spyOn(abuseRepository, 'findOneByChainIdAndEscrowAddress')
        .mockReturnValue(abuseEntity as any);

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of({ status: 200, data: { ok: true } }) as any);

      OperatorUtils.getLeader = jest.fn().mockResolvedValue({
        amountStaked: 10,
      });

      await abuseService.receiveSlackInteraction(dto as any);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://slack.com/api/views.open',
        expect.any(Object),
        {
          headers: {
            Authorization: `Bearer ${slackConfigService.oauthToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should update slack message and entity if data type is view_submission', async () => {
      const abuseEntity = {
        escrowAddress,
        chainId,
      };

      const dto = {
        callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
        chainId,
        type: 'view_submission',
        view: {
          state: {
            values: {
              quantity_input: { quantity: { value: 10 } },
            },
          },
        },
      };

      jest
        .spyOn(abuseRepository, 'findOneByChainIdAndEscrowAddress')
        .mockReturnValue(abuseEntity as any);

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of({ status: 200, data: { ok: true } }) as any);

      OperatorUtils.getLeader = jest.fn().mockResolvedValue({
        amountStaked: 10,
      });
      (abuseService as any).localStorage[dto.callback_id] = MOCK_FILE_URL;
      await abuseService.receiveSlackInteraction(dto as any);

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        decision: AbuseDecision.ACCEPTED,
        amount: dto.view.state.values.quantity_input.quantity.value,
        retriesCount: 0,
        escrowAddress,
        chainId,
      });
      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_FILE_URL,
        expect.any(Object),
      );
    });

    it('should update the entity if data type is interactive_message and the decision is rejected', async () => {
      const abuseEntity = {
        escrowAddress,
        chainId,
      };

      const dto = {
        callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.REJECTED }],
      };

      jest
        .spyOn(abuseRepository, 'findOneByChainIdAndEscrowAddress')
        .mockReturnValue(abuseEntity as any);

      await abuseService.receiveSlackInteraction(dto as any);

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        decision: AbuseDecision.REJECTED,
        retriesCount: 0,
        escrowAddress,
        chainId,
      });
    });

    it('should fail if the escrow address of the abuse is wrong', async () => {
      const abuseEntity = {
        escrowAddress,
        chainId,
      };

      const dto = {
        callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.ACCEPTED }],
      };

      jest
        .spyOn(abuseRepository, 'findOneByChainIdAndEscrowAddress')
        .mockReturnValue(undefined as any);

      await expect(
        abuseService.receiveSlackInteraction(dto as any),
      ).rejects.toThrow(ErrorSlack.AbuseNotFound);
    });
  });

  describe('slashAccount', () => {
    it('should call the slash method of the contract', async () => {
      const staker = '0xCf88b3f1992458C2f5a229573c768D0E9F70C442';
      const slasher = '0xCf88b3f1992458C2f5a229573c768D0E9F70C443';
      const amount = 10;

      const mockSlash = jest.fn();
      (StakingClient.build as any).mockImplementationOnce(() => ({
        slash: mockSlash,
      }));

      await abuseService.slashAccount(
        slasher,
        staker,
        chainId,
        escrowAddress,
        amount,
      );

      expect(mockSlash).toHaveBeenCalledWith(
        slasher,
        staker,
        escrowAddress,
        BigInt(ethers.parseUnits(amount.toString(), 'ether')),
      );
    });
  });

  describe('handleAbuseError', () => {
    it('should set abuse status to FAILED if retries exceed threshold', async () => {
      const abuseEntity: Partial<AbuseEntity> = {
        id: 1,
        status: AbuseStatus.PENDING,
        retriesCount: MOCK_MAX_RETRY_COUNT,
      };
      await (abuseService as any).handleAbuseError(
        abuseEntity,
        new Error('Sample error'),
      );
      expect(abuseRepository.updateOne).toHaveBeenCalled();
      expect(abuseEntity.status).toBe(AbuseStatus.FAILED);
    });

    it('should increment retries count if below threshold', async () => {
      const abuseEntity: Partial<AbuseEntity> = {
        id: 1,
        status: AbuseStatus.PENDING,
        retriesCount: 0,
      };
      await (abuseService as any).handleAbuseError(
        abuseEntity,
        new Error('Sample error'),
      );
      expect(abuseRepository.updateOne).toHaveBeenCalled();
      expect(abuseEntity.status).toBe(AbuseStatus.PENDING);
      expect(abuseEntity.retriesCount).toBe(1);
      expect(abuseEntity.waitUntil).toBeInstanceOf(Date);
    });
  });
});
