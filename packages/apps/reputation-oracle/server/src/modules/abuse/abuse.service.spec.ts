jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import {
  EscrowUtils,
  IOperator,
  OperatorUtils,
  StakingClient,
} from '@human-protocol/sdk';
import { EscrowData } from '@human-protocol/sdk/dist/graphql';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EventType, ReputationEntityType } from '../../common/enums';
import { PostgresErrorCodes } from '../../common/enums/database';
import { DatabaseError } from '../../common/errors/database';
import { ServerConfigService } from '../../config/server-config.service';
import { ReputationService } from '../reputation/reputation.service';
import { generateTestnetChainId } from '../web3/fixtures';
import { Web3Service } from '../web3/web3.service';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';
import { AbuseSlackBot } from './abuse.slack-bot';
import { AbuseDecision, AbuseStatus } from './constants';
import { generateAbuseEntity } from './fixtures';

const fakeAddress = faker.finance.ethereumAddress();

const mockAbuseRepository = createMock<AbuseRepository>();
const mockAbuseSlackBot = createMock<AbuseSlackBot>();
const mockReputationService = createMock<ReputationService>();
const mockWeb3Service = createMock<Web3Service>();
const mockWebhookOutgoingService = createMock<WebhookOutgoingService>();

const mockedStakingClient = jest.mocked(StakingClient);
const mockedOperatorUtils = jest.mocked(OperatorUtils);
const mockedEscrowUtils = jest.mocked(EscrowUtils);

describe('AbuseService', () => {
  let abuseService: AbuseService;

  const escrowAddress = faker.finance.ethereumAddress();
  const chainId = generateTestnetChainId();
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
          useValue: mockAbuseSlackBot,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        { provide: AbuseRepository, useValue: mockAbuseRepository },
        {
          provide: ReputationService,
          useValue: mockReputationService,
        },
        {
          provide: WebhookOutgoingService,
          useValue: mockWebhookOutgoingService,
        },
      ],
    }).compile();

    abuseService = moduleRef.get<AbuseService>(AbuseService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('reportAbuse', () => {
    it('should create a new abuse entity', async () => {
      const userId = faker.number.int();

      await abuseService.reportAbuse({
        escrowAddress,
        chainId,
        userId,
      });

      expect(mockAbuseRepository.createUnique).toHaveBeenCalledWith({
        escrowAddress: escrowAddress,
        chainId: chainId,
        userId: userId,
        retriesCount: 0,
        status: AbuseStatus.PENDING,
        waitUntil: expect.any(Date),
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

      mockAbuseRepository.findOneById.mockResolvedValueOnce(abuseEntity);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        launcher: fakeAddress,
      } as EscrowData);
      const amount = faker.number.int();
      mockedOperatorUtils.getOperator.mockResolvedValueOnce({
        amountStaked: BigInt(amount),
      } as IOperator);

      await abuseService.processSlackInteraction(dto as any);

      expect(mockAbuseSlackBot.triggerAbuseReportModal).toHaveBeenCalledTimes(
        1,
      );
      expect(mockAbuseSlackBot.triggerAbuseReportModal).toHaveBeenCalledWith({
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

      mockAbuseRepository.findOneById.mockResolvedValueOnce(abuseEntity);

      await abuseService.processSlackInteraction(dto as any);

      expect(mockAbuseSlackBot.updateMessage).toHaveBeenCalledTimes(1);
      expect(mockAbuseSlackBot.updateMessage).toHaveBeenCalledWith(
        JSON.parse(dto.view.private_metadata).responseUrl,
        `Abuse accepted. Escrow: ${abuseEntity.escrowAddress}, ChainId: ${abuseEntity.chainId}, Slashed amount: 10 HMT`,
      );
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
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

      mockAbuseRepository.findOneById.mockResolvedValueOnce(abuseEntity);

      await abuseService.processSlackInteraction(dto as any);

      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
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

      mockAbuseRepository.findOneById.mockResolvedValueOnce(null);

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

      mockAbuseRepository.findOneById.mockResolvedValueOnce(null);

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

      mockAbuseRepository.findToClassify.mockResolvedValueOnce(
        mockAbuseEntities,
      );
      mockedEscrowUtils.getEscrow
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        } as EscrowData)
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        } as EscrowData);
      mockedOperatorUtils.getOperator
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl1,
        } as IOperator)
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl2,
        } as IOperator);
      mockAbuseSlackBot.sendAbuseNotification
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await abuseService.processAbuseRequests();

      expect(mockAbuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(mockAbuseSlackBot.sendAbuseNotification).toHaveBeenCalledTimes(2);
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.NOTIFIED,
      });
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[1],
        status: AbuseStatus.NOTIFIED,
      });
    });

    it('should handle errors when sending notifications fails', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 0 })];

      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        exchangeOracle: fakeAddress,
      } as EscrowData);
      mockedOperatorUtils.getOperator.mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      } as IOperator);
      mockAbuseRepository.findToClassify.mockResolvedValueOnce(
        mockAbuseEntities,
      );

      mockAbuseSlackBot.sendAbuseNotification.mockRejectedValueOnce(
        new Error(),
      );

      await abuseService.processAbuseRequests();

      expect(mockAbuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });
    });

    it('should handle errors when createOutgoingWebhook fails', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 0 })];

      mockAbuseRepository.findToClassify.mockResolvedValueOnce(
        mockAbuseEntities,
      );
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        exchangeOracle: fakeAddress,
      } as EscrowData);
      mockedOperatorUtils.getOperator.mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      } as IOperator);

      mockWebhookOutgoingService.createOutgoingWebhook.mockRejectedValueOnce(
        new DatabaseError('Failed to create webhook'),
      );

      await abuseService.processAbuseRequests();

      expect(mockAbuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 1,
      });
    });

    it('should continue if createOutgoingWebhook throws a duplicated error', async () => {
      const mockAbuseEntities = [generateAbuseEntity(), generateAbuseEntity()];

      mockAbuseRepository.findToClassify.mockResolvedValueOnce(
        mockAbuseEntities,
      );
      mockedEscrowUtils.getEscrow
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        } as EscrowData)
        .mockResolvedValueOnce({
          exchangeOracle: fakeAddress,
        } as EscrowData);
      mockedOperatorUtils.getOperator
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl1,
        } as IOperator)
        .mockResolvedValueOnce({
          webhookUrl: webhookUrl2,
        } as IOperator);

      mockWebhookOutgoingService.createOutgoingWebhook.mockRejectedValueOnce(
        new DatabaseError(PostgresErrorCodes.Duplicated),
      );

      await abuseService.processAbuseRequests();

      expect(mockAbuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.NOTIFIED,
      });
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[1],
        status: AbuseStatus.NOTIFIED,
      });
    });

    it('should set abuse status to failed after exceeding 5 retry attempts', async () => {
      const mockAbuseEntities = [generateAbuseEntity({ retriesCount: 5 })];

      mockAbuseRepository.findToClassify.mockResolvedValueOnce(
        mockAbuseEntities,
      );

      await abuseService.processAbuseRequests();

      expect(mockAbuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        retriesCount: 5,
        status: AbuseStatus.FAILED,
      });
    });

    it('should handle empty results from findToClassify', async () => {
      mockAbuseRepository.findToClassify.mockResolvedValueOnce([]);

      await abuseService.processAbuseRequests();

      expect(mockAbuseRepository.findToClassify).toHaveBeenCalledTimes(1);
      expect(mockAbuseSlackBot.sendAbuseNotification).not.toHaveBeenCalled();
      expect(mockAbuseRepository.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('processClassifiedAbuses', () => {
    it('should process accepted abuses', async () => {
      const mockAbuseEntities = [
        generateAbuseEntity({ decision: AbuseDecision.ACCEPTED }),
      ];

      mockAbuseRepository.findClassified.mockResolvedValueOnce(
        mockAbuseEntities,
      );
      const slashMock = jest.fn();
      mockedStakingClient.build.mockResolvedValueOnce({
        slash: slashMock,
      } as unknown as StakingClient);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        launcher: fakeAddress,
      } as EscrowData);
      mockedOperatorUtils.getOperator.mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      } as IOperator);
      mockWebhookOutgoingService.createOutgoingWebhook.mockResolvedValueOnce(
        undefined,
      );

      await abuseService.processClassifiedAbuses();

      expect(mockAbuseRepository.findClassified).toHaveBeenCalledTimes(1);
      // expect(slashMock).toHaveBeenCalledWith(
      //   expect.any(String),
      //   expect.any(String),
      //   chainId,
      //   escrowAddress,
      //   expect.any(Number),
      // );
      expect(
        mockWebhookOutgoingService.createOutgoingWebhook,
      ).toHaveBeenCalledWith(
        {
          escrowAddress: mockAbuseEntities[0].escrowAddress,
          chainId: mockAbuseEntities[0].chainId,
          eventType: EventType.ABUSE_DETECTED,
        },
        expect.any(String),
      );
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.COMPLETED,
      });
    });

    it('should process rejected abuses', async () => {
      const mockAbuseEntities = [
        generateAbuseEntity({ decision: AbuseDecision.REJECTED }),
      ];

      mockAbuseRepository.findClassified.mockResolvedValueOnce(
        mockAbuseEntities,
      );
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce({
        exchangeOracle: fakeAddress,
      } as EscrowData);
      mockedOperatorUtils.getOperator.mockResolvedValueOnce({
        webhookUrl: webhookUrl1,
      } as IOperator);
      mockReputationService.decreaseReputation.mockResolvedValueOnce(undefined);

      await abuseService.processClassifiedAbuses();

      expect(mockAbuseRepository.findClassified).toHaveBeenCalledTimes(1);
      expect(mockReputationService.decreaseReputation).toHaveBeenCalledWith(
        mockAbuseEntities[0].chainId,
        mockAbuseEntities[0].user?.evmAddress,
        ReputationEntityType.WORKER,
      );
      expect(mockAbuseRepository.updateOne).toHaveBeenCalledWith({
        ...mockAbuseEntities[0],
        status: AbuseStatus.COMPLETED,
      });
    });

    it('should handle empty results from findClassified', async () => {
      mockAbuseRepository.findClassified.mockResolvedValueOnce([]);

      await abuseService.processClassifiedAbuses();

      expect(mockAbuseRepository.findClassified).toHaveBeenCalledTimes(1);
      expect(
        mockWebhookOutgoingService.createOutgoingWebhook,
      ).not.toHaveBeenCalled();
      expect(mockAbuseRepository.updateOne).not.toHaveBeenCalled();
    });
  });
});
