import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { MOCK_SIGNATURE } from '../../../test/constants';
import { EventType } from '../../common/enums/webhook';
import { WebhookController } from './webhook.controller';
import { WebhookDto } from './webhook.dto';
import { WebhookService } from './webhook.service';
import { AssignmentRepository } from '../assignment/assignment.repository';

jest.mock('../../common/utils/signature');

describe('webhookController', () => {
  let webhookController: WebhookController;
  let webhookService: WebhookService;
  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [WebhookController],
      providers: [
        { provide: WebhookService, useValue: createMock<WebhookService>() },
        {
          provide: AssignmentRepository,
          useValue: createMock<AssignmentRepository>(),
        },
      ],
    }).compile();

    webhookController = moduleRef.get<WebhookController>(WebhookController);
    webhookService = moduleRef.get<WebhookService>(WebhookService);
  });

  describe('processWebhook', () => {
    it('should call webhookService.handleWebhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_CREATED,
      };
      jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue();

      await webhookController.processWebhook(MOCK_SIGNATURE, webhook);

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });
  });
});
