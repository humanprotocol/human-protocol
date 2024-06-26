import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { Web3Service } from '../web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JobService } from '../job/job.service';
import { EventType } from '../../common/enums/webhook';
import { ChainId } from '@human-protocol/sdk';
import { WebhookDataDto } from './webhook.dto';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import {
  MOCK_ADDRESS,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
} from '../../../test/constants';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';

jest.mock('@human-protocol/sdk');

describe('WebhookController', () => {
  let webhookController: WebhookController;
  let jobService: JobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        WebhookService,
        ServerConfigService,
        Web3ConfigService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockResolvedValue({
              address: MOCK_ADDRESS,
              getNetwork: jest
                .fn()
                .mockResolvedValue({ chainId: ChainId.LOCALHOST }),
            }),
          },
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'HOST':
                  return '127.0.0.1';
                case 'PORT':
                  return 5000;
                case 'WEB3_PRIVATE_KEY':
                  return MOCK_PRIVATE_KEY;
                case 'MAX_RETRY_COUNT':
                  return MOCK_MAX_RETRY_COUNT;
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
        {
          provide: JobService,
          useValue: createMock<JobService>(),
        },
      ],
    }).compile();

    webhookController = module.get<WebhookController>(WebhookController);
    jobService = module.get<JobService>(JobService);
  });

  describe('Handle Escrow Failure', () => {
    it('should throw an error for invalid manifest URL', async () => {
      // Adjusted to use `reason` field for specifying the error
      const invalidDto: WebhookDataDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.ESCROW_FAILED,
        eventData: {
          reason: 'Invalid manifest URL',
        },
      };
      const mockSignature = 'Human-Signature';

      jest
        .spyOn(jobService, 'escrowFailedWebhook')
        .mockImplementation(async () => {
          throw new ControlledError(
            'Invalid manifest URL',
            HttpStatus.BAD_REQUEST,
          );
        });

      await expect(
        webhookController.processWebhook(mockSignature, invalidDto),
      ).rejects.toThrow(
        new ControlledError('Invalid manifest URL', HttpStatus.BAD_REQUEST),
      );

      expect(jobService.escrowFailedWebhook).toHaveBeenCalledWith(invalidDto);
    });

    it('should throw an error when the manifest cannot be downloaded', async () => {
      const manifestCannotBeDownloadedDto: WebhookDataDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.ESCROW_FAILED,
        eventData: {
          reason: 'Manifest cannot be downloaded',
        },
      };
      const mockSignature = 'Human-Signature';

      jest
        .spyOn(jobService, 'escrowFailedWebhook')
        .mockImplementation(async () => {
          throw new BadRequestException('Manifest cannot be downloaded');
        });

      await expect(
        webhookController.processWebhook(
          mockSignature,
          manifestCannotBeDownloadedDto,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(jobService.escrowFailedWebhook).toHaveBeenCalledWith(
        manifestCannotBeDownloadedDto,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
