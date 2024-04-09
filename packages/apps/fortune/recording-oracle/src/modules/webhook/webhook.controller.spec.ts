import { PGPConfigService } from '@/common/config/pgp-config.service';
import { S3ConfigService } from '@/common/config/s3-config.service';
import { ServerConfigService } from '@/common/config/server-config.service';
import { Web3ConfigService } from '@/common/config/web3-config.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { MOCK_FILE_URL, MOCK_SIGNATURE } from '../../../test/constants';
import { EventType } from '../../common/enums/webhook';
import { verifySignature } from '../../common/utils/signature';
import { JobService } from '../job/job.service';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookController } from './webhook.controller';
import { WebhookDto } from './webhook.dto';
import { WebhookService } from './webhook.service';

jest.mock('../../common/utils/signature');

describe('webhookController', () => {
  let webhookController: WebhookController;
  let webhookService: WebhookService;
  let jobService: JobService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';

  const httpServicePostMock = jest
    .fn()
    .mockReturnValue(of({ status: 200, data: {} }));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        WebhookService,
        JobService,
        ConfigService,
        Web3ConfigService,
        PGPConfigService,
        S3ConfigService,
        ServerConfigService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue({
              address: '0x1234567890123456789012345678901234567892',
              getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
            }),
          },
        },
        StorageService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn().mockReturnValue(of({ status: 200, data: {} })),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: httpServicePostMock,
          },
        },
      ],
    }).compile();

    webhookController = moduleRef.get<WebhookController>(WebhookController);
    webhookService = moduleRef.get<WebhookService>(WebhookService);
    jobService = moduleRef.get<JobService>(JobService);
  });

  describe('processWebhook', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('should handle an incoming escrow completed webhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_COMPLETED,
      };
      jest.spyOn(webhookService, 'handleWebhook');

      (verifySignature as jest.Mock).mockReturnValue(true);

      await webhookController.processWebhook(MOCK_SIGNATURE, webhook);

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });

    it('should handle an incoming solution in review webhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
      };

      jest
        .spyOn(jobService, 'processJobSolution')
        .mockImplementation(async () => 'OK');

      (verifySignature as jest.Mock).mockReturnValue(true);

      jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue();

      await webhookController.processWebhook(MOCK_SIGNATURE, webhook);

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });

    it('should return an error when the event type is invalid', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.TASK_COMPLETED,
      };
      jest.spyOn(webhookService, 'handleWebhook');

      (verifySignature as jest.Mock).mockReturnValue(true);

      await expect(
        webhookController.processWebhook(MOCK_SIGNATURE, webhook),
      ).rejects.toThrow('Invalid webhook event type: task_completed');

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });
  });
});
