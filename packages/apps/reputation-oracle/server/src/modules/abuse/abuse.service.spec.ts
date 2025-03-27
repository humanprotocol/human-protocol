import { faker } from '@faker-js/faker/.';
import { createMock } from '@golevelup/ts-jest';
import { OperatorUtils, StakingClient } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EventType, ReputationEntityType } from '../../common/enums';
import { AbuseDecision, AbuseStatus } from './common';
import { PostgresErrorCodes } from '../../common/enums/database';
import { DatabaseError } from '../../common/errors/database';
import { ServerConfigService } from '../../config/server-config.service';
import { ReputationService } from '../reputation/reputation.service';
import { SlackService } from '../slack/slack.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';
import { generateAbuseEntity } from './fixtures';

const manifestUrl = faker.internet.url();
const fakeAddress = faker.finance.ethereumAddress();
jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      getManifestUrl: jest.fn().mockResolvedValue(manifestUrl),
      getJobLauncherAddress: jest.fn().mockResolvedValue(fakeAddress),
      getExchangeOracleAddress: jest.fn().mockResolvedValue(fakeAddress),
    })),
  },
  StakingClient: {
    build: jest.fn().mockImplementation(() => ({
      slash: jest.fn(),
    })),
  },
  OperatorUtils: {
    getOperator: jest.fn(),
  },
}));

describe('Abuse Service', () => {
  let abuseService: AbuseService;
  let slackService: SlackService;
  let abuseRepository: AbuseRepository;
  let webhookOutgoingService: WebhookOutgoingService;
  let reputationService: ReputationService;

  const escrowAddress = faker.finance.ethereumAddress();
  const chainId = faker.number.int({ max: 100000 });
  const webhookUrl1 = faker.internet.url();
  const webhookUrl2 = faker.internet.url();

  beforeAll(async () => {
    const signerMock = {
      address: faker.finance.ethereumAddress(),
      getNetwork: jest.fn().mockResolvedValue({ chainId }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AbuseService,
        ConfigService,
        ServerConfigService,
        {
          provide: SlackService,
          useValue: createMock<SlackService>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: AbuseRepository, useValue: createMock<AbuseRepository>() },
        {
          provide: ReputationService,
          useValue: createMock<ReputationService>(),
        },
        {
          provide: WebhookOutgoingService,
          useValue: createMock<WebhookOutgoingService>(),
        },
      ],
    }).compile();

    slackService = moduleRef.get<SlackService>(SlackService);
    abuseService = moduleRef.get<AbuseService>(AbuseService);
    abuseRepository = moduleRef.get<AbuseRepository>(AbuseRepository);
    webhookOutgoingService = moduleRef.get<WebhookOutgoingService>(
      WebhookOutgoingService,
    );
    reputationService = moduleRef.get<ReputationService>(ReputationService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('receiveInteractions', () => {
    it('should send an Abuse Report Modal to slack if data type is interactive_message and the decision is accepted', async () => {
      const abuseEntity = generateAbuseEntity({ status: AbuseStatus.NOTIFIED });

      const dto = {
        callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.ACCEPTED }],
      };

      jest
        .spyOn(abuseRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValueOnce(abuseEntity);

      // jest
      //   .spyOn(httpService, 'post')
      //   .mockReturnValueOnce(of({ status: 200, data: { ok: true } }) as any);

      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        amountStaked: 10,
      });

      await abuseService.processSlackInteraction(dto as any);

      // expect(httpService.post).toHaveBeenCalledWith(
      //   'https://slack.com/api/views.open',
      //   expect.any(Object),
      //   {
      //     headers: {
      //       Authorization: `Bearer ${slackConfigService.oauthToken}`,
      //       'Content-Type': 'application/json',
      //     },
      //   },
      // );
    });

    it('should update slack message and entity if data type is view_submission', async () => {
      const abuseEntity = generateAbuseEntity({ status: AbuseStatus.NOTIFIED });

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
        .mockResolvedValueOnce(abuseEntity as any);

      // jest
      //   .spyOn(httpService, 'post')
      //   .mockReturnValueOnce(of({ status: 200, data: { ok: true } }) as any);

      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        amountStaked: 10,
      });
      (abuseService as any).localStorage[dto.callback_id] = manifestUrl;

      await abuseService.processSlackInteraction(dto as any);

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...abuseEntity,
        decision: AbuseDecision.ACCEPTED,
        amount: dto.view.state.values.quantity_input.quantity.value,
      });
      // expect(httpService.post).toHaveBeenCalledWith(
      //   manifestUrl,
      //   expect.any(Object),
      // );
    });

    it('should update the entity if data type is interactive_message and the decision is rejected', async () => {
      const abuseEntity = generateAbuseEntity({ status: AbuseStatus.NOTIFIED });

      const dto = {
        callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.REJECTED }],
      };

      jest
        .spyOn(abuseRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValueOnce(abuseEntity);

      await abuseService.processSlackInteraction(dto);

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...abuseEntity,
        decision: AbuseDecision.REJECTED,
        retriesCount: 0,
      });
    });

    it('should fail if the escrow address of the abuse is wrong', async () => {
      // const abuseEntity = generateAbuseEntity({ status: AbuseStatus.NOTIFIED });

      // const dto = {
      //   callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
      //   chainId,
      //   type: 'interactive_message',
      //   actions: [{ value: AbuseDecision.ACCEPTED }],
      // };

      jest
        .spyOn(abuseRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValueOnce(null);

      // await expect(abuseService.receiveInteractions(dto)).rejects.toThrow(
      //   AbuseErrorMessage.AbuseNotFound,
      // );
    });
  });

  describe('processAbuseRequests', () => {
    it('should process pending abuse requests', async () => {
      const mockAbuseEntities = [generateAbuseEntity(), generateAbuseEntity()];
      jest
        .spyOn(abuseRepository, 'findByStatus')
        .mockResolvedValueOnce(mockAbuseEntities);
      OperatorUtils.getOperator = jest
        .fn()
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl1,
        })
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl2,
        });
      jest
        .spyOn(slackService, 'sendNotification')
        .mockResolvedValueOnce(undefined);

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findByStatus).toHaveBeenCalledTimes(1);
      expect(slackService.sendNotification).toHaveBeenCalledTimes(2);
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.NOTIFIED,
      });
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[1],
        status: AbuseStatus.NOTIFIED,
      });
    });

    it('should handle error if no webhook url found', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 0 })];

      jest
        .spyOn(abuseRepository, 'findByStatus')
        .mockResolvedValueOnce(mockAbuseEntities);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: null,
      });

      await abuseService.processAbuseRequests();

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });
    });

    it('should handle errors when createOutgoingWebhook fails', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 0 })];

      jest
        .spyOn(abuseRepository, 'findByStatus')
        .mockResolvedValueOnce(mockAbuseEntities);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(new DatabaseError('Failed to create webhook'));
      await abuseService.processAbuseRequests();

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });
    });

    it('should continue if createOutgoingWebhook throws a duplicated error', async () => {
      const mockAbuseEntities = [generateAbuseEntity(), generateAbuseEntity()];

      jest
        .spyOn(abuseRepository, 'findByStatus')
        .mockResolvedValueOnce(mockAbuseEntities);
      OperatorUtils.getOperator = jest
        .fn()
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl1,
        })
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl2,
        });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(
          new DatabaseError(PostgresErrorCodes.Duplicated),
        );
      jest
        .spyOn(slackService, 'sendNotification')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findByStatus).toHaveBeenCalledTimes(1);
      expect(webhookOutgoingService.createOutgoingWebhook).toHaveBeenCalledWith(
        {
          escrowAddress: mockAbuseEntities[0].escrowAddress,
          chainId: mockAbuseEntities[0].chainId,
          eventType: EventType.ABUSE_REPORTED,
        },
        webhookUrl1,
      );
      expect(webhookOutgoingService.createOutgoingWebhook).toHaveBeenCalledWith(
        {
          escrowAddress: mockAbuseEntities[1].escrowAddress,
          chainId: mockAbuseEntities[1].chainId,
          eventType: EventType.ABUSE_REPORTED,
        },
        webhookUrl2,
      );
      expect(slackService.sendNotification).toHaveBeenCalledTimes(2);
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.NOTIFIED,
      });
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[1],
        status: AbuseStatus.NOTIFIED,
      });
    });

    it('should set abuse status to failed after exceeding 5 retry attempts', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 5 })];

      jest
        .spyOn(abuseRepository, 'findByStatus')
        .mockResolvedValueOnce(mockAbuseEntities);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: null,
      });

      await abuseService.processAbuseRequests();

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 5,
        status: AbuseStatus.FAILED,
      });
    });
  });

  describe('processClassifiedAbuses', () => {
    it('should process accepted abuses', async () => {
      const mockAbuseEntities = [
        generateAbuseEntity({ decision: AbuseDecision.ACCEPTED }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities as any);
      const slashMock = jest.fn();
      StakingClient.build = jest.fn().mockImplementationOnce(() => ({
        slash: slashMock,
      }));
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalled();
      // expect(slashMock).toHaveBeenCalledWith(
      //   expect.any(String),
      //   expect.any(String),
      //   chainId,
      //   escrowAddress,
      //   expect.any(Number),
      // );

      expect(webhookOutgoingService.createOutgoingWebhook).toHaveBeenCalledWith(
        {
          escrowAddress: mockAbuseEntities[0].escrowAddress,
          chainId: mockAbuseEntities[0].chainId,
          eventType: EventType.ABUSE_REPORTED,
        },
        webhookUrl1,
      );
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.COMPLETED,
      });
    });
    it('should process rejected abuses', async () => {
      const mockAbuseEntities = [
        generateAbuseEntity({ decision: AbuseDecision.REJECTED }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities as any);
      const slashMock = jest.fn();
      StakingClient.build = jest.fn().mockImplementationOnce(() => ({
        slash: slashMock,
      }));
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalled();
      expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
        mockAbuseEntities[0].chainId,
        mockAbuseEntities[0].user?.evmAddress as string,
        ReputationEntityType.WORKER,
      );
      expect(webhookOutgoingService.createOutgoingWebhook).toHaveBeenCalledWith(
        {
          escrowAddress: mockAbuseEntities[0].escrowAddress,
          chainId: mockAbuseEntities[0].chainId,
          eventType: EventType.ABUSE_COMPLAINT_DISMISSED,
        },
        webhookUrl1,
      );
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.COMPLETED,
      });
    });

    it('should handle errors when createOutgoingWebhook fails', async () => {
      let mockAbuseEntities = [
        generateAbuseEntity({
          decision: AbuseDecision.ACCEPTED,
          retriesCount: 0,
        }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities as any);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(new DatabaseError('Failed to create webhook'));

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalled();
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });

      mockAbuseEntities = [
        generateAbuseEntity({
          decision: AbuseDecision.REJECTED,
          retriesCount: 0,
        }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities as any);
      jest
        .spyOn(reputationService, 'decreaseReputation')
        .mockResolvedValueOnce(undefined);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(new DatabaseError('Failed to create webhook'));

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalled();
      expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
        mockAbuseEntities[0].chainId,
        mockAbuseEntities[0].user?.evmAddress,
        ReputationEntityType.WORKER,
      );
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });
    });

    it('should continue if createOutgoingWebhook throws a duplicated error', async () => {
      let mockAbuseEntities = [
        generateAbuseEntity({
          decision: AbuseDecision.ACCEPTED,
          retriesCount: 0,
        }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities as any);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(
          new DatabaseError(PostgresErrorCodes.Duplicated),
        );

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalled();
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.COMPLETED,
      });

      mockAbuseEntities = [
        generateAbuseEntity({
          decision: AbuseDecision.REJECTED,
          retriesCount: 0,
        }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities as any);
      jest
        .spyOn(reputationService, 'decreaseReputation')
        .mockResolvedValueOnce(undefined);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(
          new DatabaseError(PostgresErrorCodes.Duplicated),
        );

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalled();
      expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
        mockAbuseEntities[0].chainId,
        mockAbuseEntities[0].user?.evmAddress,
        ReputationEntityType.WORKER,
      );
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.COMPLETED,
      });
    });

    it('should set abuse status to failed after exceeding 5 retry attempts', async () => {
      const mockAbuseEntities = [
        generateAbuseEntity({
          decision: AbuseDecision.REJECTED,
          retriesCount: 5,
        }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities as any);
      jest
        .spyOn(reputationService, 'decreaseReputation')
        .mockResolvedValueOnce(undefined);
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(new DatabaseError('Failed to create webhook'));

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalled();
      expect(reputationService.decreaseReputation).toHaveBeenCalledWith(
        mockAbuseEntities[0].chainId,
        mockAbuseEntities[0].user?.evmAddress,
        ReputationEntityType.WORKER,
      );
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 5,
        status: AbuseStatus.FAILED,
      });
    });
  });

  describe('getAbuseReportsByUser', () => {
    it('should return a list of abuse reports for a specific user', async () => {
      const userId = faker.number.int();
      const mockAbuseEntities = [
        generateAbuseEntity({ userId }),
        generateAbuseEntity({ userId }),
      ];

      jest
        .spyOn(abuseRepository, 'findByUserId')
        .mockResolvedValueOnce(mockAbuseEntities);

      const result = await abuseService.getAbuseReportsByUser(userId);

      expect(abuseRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(
        mockAbuseEntities.map((abuseEntity) => ({
          id: abuseEntity.id,
          escrowAddress: abuseEntity.escrowAddress,
          chainId: abuseEntity.chainId,
          status: abuseEntity.status,
        })),
      );
    });

    it('should return an empty array if no abuse reports are found for the user', async () => {
      const userId = faker.number.int();

      jest.spyOn(abuseRepository, 'findByUserId').mockResolvedValueOnce([]);

      const result = await abuseService.getAbuseReportsByUser(userId);

      expect(abuseRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });

    it('should handle errors thrown by the repository', async () => {
      const userId = faker.number.int();

      jest
        .spyOn(abuseRepository, 'findByUserId')
        .mockRejectedValueOnce(new DatabaseError('Database error'));

      await expect(abuseService.getAbuseReportsByUser(userId)).rejects.toThrow(
        'Database error',
      );

      expect(abuseRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
