import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { EscrowUtils, OperatorUtils, StakingClient } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EventType, ReputationEntityType } from '../../common/enums';
import { PostgresErrorCodes } from '../../common/enums/database';
import { DatabaseError } from '../../common/errors/database';
import { ServerConfigService } from '../../config/server-config.service';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';
import { AbuseSlackBot } from './abuse.slack-bot';
import { AbuseDecision, AbuseStatus } from './constants';
import { generateAbuseEntity } from './fixtures';

const fakeAddress = faker.finance.ethereumAddress();
jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StakingClient: {
    build: jest.fn().mockImplementation(() => ({
      slash: jest.fn(),
    })),
  },
  OperatorUtils: {
    getOperator: jest.fn(),
  },
  EscrowUtils: {
    getEscrow: jest.fn(),
  },
}));

describe('AbuseService', () => {
  let abuseService: AbuseService;
  let abuseSlackBot: AbuseSlackBot;
  let abuseRepository: AbuseRepository;
  let webhookOutgoingService: WebhookOutgoingService;
  let reputationService: ReputationService;

  const escrowAddress = faker.finance.ethereumAddress();
  const chainId = faker.number.int({ max: 100000 });
  const webhookUrl1 = faker.internet.url();
  const webhookUrl2 = faker.internet.url();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AbuseService,
        ConfigService,
        ServerConfigService,
        {
          provide: AbuseSlackBot,
          useValue: createMock<AbuseSlackBot>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue({
              address: faker.finance.ethereumAddress(),
              getNetwork: jest.fn().mockResolvedValue({ chainId }),
            }),
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

    abuseSlackBot = moduleRef.get<AbuseSlackBot>(AbuseSlackBot);
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

  describe('reportAbuse', () => {
    it('should create a new abuse entity', async () => {
      const userId = 1;

      await abuseService.reportAbuse({
        escrowAddress,
        chainId,
        userId,
      });

      expect(abuseRepository.createUnique).toHaveBeenCalledWith({
        escrowAddress: escrowAddress,
        chainId: chainId,
        userId: userId,
        retriesCount: 0,
        status: AbuseStatus.PENDING,
      });
    });
  });

  describe('processSlackInteraction', () => {
    it('should send an Abuse Report Modal to Slack if the decision is accepted', async () => {
      const abuseEntity = generateAbuseEntity({ status: AbuseStatus.NOTIFIED });

      const dto = {
        callback_id: abuseEntity.id,
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.ACCEPTED }],
        trigger_id: faker.string.uuid(),
        response_url: faker.internet.url(),
      };

      jest
        .spyOn(abuseRepository, 'findOneById')
        .mockResolvedValueOnce(abuseEntity);

      EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
        launcher: fakeAddress,
      });
      const amount = faker.number.int();
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        amountStaked: amount,
      });

      await abuseService.processSlackInteraction(dto as any);

      expect(abuseSlackBot.triggerAbuseReportModal).toHaveBeenCalledWith({
        abuseId: abuseEntity.id,
        escrowAddress: abuseEntity.escrowAddress,
        chainId: abuseEntity.chainId,
        maxAmount: amount,
        triggerId: dto.trigger_id,
        responseUrl: dto.response_url,
      });
    });

    it('should update Slack message and entity if the decision is submitted via view_submission', async () => {
      const abuseEntity = generateAbuseEntity({ status: AbuseStatus.NOTIFIED });

      const dto = {
        chainId,
        type: 'view_submission',
        view: {
          callback_id: abuseEntity.id,
          private_metadata: JSON.stringify({
            responseUrl: faker.internet.url(),
          }),
          state: {
            values: {
              quantity_input: { quantity: { value: 10 } },
            },
          },
        },
      };

      jest
        .spyOn(abuseRepository, 'findOneById')
        .mockResolvedValueOnce(abuseEntity);

      await abuseService.processSlackInteraction(dto as any);

      expect(abuseSlackBot.updateMessage).toHaveBeenCalledWith(
        JSON.parse(dto.view.private_metadata).responseUrl,
        `Abuse accepted. Escrow: ${abuseEntity.escrowAddress}, ChainId: ${abuseEntity.chainId}, Slashed amount: 10 HMT`,
      );
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...abuseEntity,
        decision: AbuseDecision.ACCEPTED,
        amount: 10,
        retriesCount: 0,
      });
    });

    it('should update the entity if the decision is rejected via interactive_message', async () => {
      const abuseEntity = generateAbuseEntity({ status: AbuseStatus.NOTIFIED });

      const dto = {
        callback_id: abuseEntity.id,
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.REJECTED }],
      };

      jest
        .spyOn(abuseRepository, 'findOneById')
        .mockResolvedValueOnce(abuseEntity);

      await abuseService.processSlackInteraction(dto as any);

      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...abuseEntity,
        decision: AbuseDecision.REJECTED,
        retriesCount: 0,
      });
    });

    it('should throw an error if the abuse entity is not found', async () => {
      const dto = {
        callback_id: faker.number.int(),
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.ACCEPTED }],
      };

      jest.spyOn(abuseRepository, 'findOneById').mockResolvedValueOnce(null);

      await expect(
        abuseService.processSlackInteraction(dto as any),
      ).rejects.toThrow('Abuse entity not found');
    });

    it('should throw an error if Callback ID is not found', async () => {
      const dto = {
        chainId,
        type: 'interactive_message',
        actions: [{ value: AbuseDecision.ACCEPTED }],
      };

      jest.spyOn(abuseRepository, 'findOneById').mockResolvedValueOnce(null);

      await expect(
        abuseService.processSlackInteraction(dto as any),
      ).rejects.toThrow(
        'Callback ID is missing from the Slack interaction data',
      );
    });
  });

  describe('processAbuseRequests', () => {
    it('should process pending abuse requests and send notifications', async () => {
      const mockAbuseEntities = [generateAbuseEntity(), generateAbuseEntity()];

      jest
        .spyOn(abuseRepository, 'findToClassify')
        .mockResolvedValueOnce(mockAbuseEntities);
      EscrowUtils.getEscrow = jest
        .fn()
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        })
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        });
      OperatorUtils.getOperator = jest
        .fn()
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl1,
        })
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl2,
        });
      jest
        .spyOn(abuseSlackBot, 'sendAbuseNotification')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(abuseSlackBot.sendAbuseNotification).toHaveBeenCalledTimes(2);
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.NOTIFIED,
      });
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[1],
        status: AbuseStatus.NOTIFIED,
      });
    });

    it('should handle errors when sending notifications fails', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 0 })];

      EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
        exchangeOracle: fakeAddress,
      });
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(abuseRepository, 'findToClassify')
        .mockResolvedValueOnce(mockAbuseEntities);
      jest
        .spyOn(abuseSlackBot, 'sendAbuseNotification')
        .mockRejectedValueOnce(new Error('Slack error'));

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });
    });

    it('should handle errors when createOutgoingWebhook fails', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 0 })];

      jest
        .spyOn(abuseRepository, 'findToClassify')
        .mockResolvedValueOnce(mockAbuseEntities);
      EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
        exchangeOracle: fakeAddress,
      });
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });

      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockRejectedValueOnce(new DatabaseError('Failed to create webhook'));

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });
    });

    it('should continue if createOutgoingWebhook throws a duplicated error', async () => {
      const mockAbuseEntities = [generateAbuseEntity(), generateAbuseEntity()];

      jest
        .spyOn(abuseRepository, 'findToClassify')
        .mockResolvedValueOnce(mockAbuseEntities);
      EscrowUtils.getEscrow = jest
        .fn()
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        })
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        });
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

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findToClassify).toHaveBeenCalledTimes(1);
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
        .spyOn(abuseRepository, 'findToClassify')
        .mockResolvedValueOnce(mockAbuseEntities);

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(abuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 5,
        status: AbuseStatus.FAILED,
      });
    });

    it('should handle empty results from findToClassify', async () => {
      jest.spyOn(abuseRepository, 'findToClassify').mockResolvedValueOnce([]);

      await abuseService.processAbuseRequests();

      expect(abuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(abuseSlackBot.sendAbuseNotification).not.toHaveBeenCalled();
      expect(abuseRepository.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('processClassifiedAbuses', () => {
    it('should process accepted abuses', async () => {
      const mockAbuseEntities = [
        generateAbuseEntity({ decision: AbuseDecision.ACCEPTED }),
      ];

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValueOnce(mockAbuseEntities);
      const slashMock = jest.fn();
      StakingClient.build = jest.fn().mockImplementationOnce(() => ({
        slash: slashMock,
      }));
      EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
        launcher: fakeAddress,
      });
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(webhookOutgoingService, 'createOutgoingWebhook')
        .mockResolvedValueOnce(undefined);

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalledTimes(1);
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
          eventType: EventType.ABUSE_DETECTED,
        },
        expect.any(String),
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
        .mockResolvedValueOnce(mockAbuseEntities);
      EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
        exchangeOracle: fakeAddress,
      });
      OperatorUtils.getOperator = jest.fn().mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      });
      jest
        .spyOn(reputationService, 'decreaseReputation')
        .mockResolvedValueOnce(undefined);

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalledTimes(1);
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

    it('should handle empty results from findClassified', async () => {
      jest.spyOn(abuseRepository, 'findClassified').mockResolvedValueOnce([]);

      await abuseService.processClassifiedAbuses();

      expect(abuseRepository.findClassified).toHaveBeenCalledTimes(1);
      expect(
        webhookOutgoingService.createOutgoingWebhook,
      ).not.toHaveBeenCalled();
      expect(abuseRepository.updateOne).not.toHaveBeenCalled();
    });
  });
});
