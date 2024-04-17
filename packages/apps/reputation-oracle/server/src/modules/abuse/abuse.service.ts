import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SlackConfigService } from 'src/common/config/slack-config.service';
import { ReportAbuseDto } from './abuse.dto';
import { AbuseEntity } from './abuse.entity';
import { AbuseRepository } from './abuse.repository';
import { SLACK_WEBHOOK_DISABLED } from 'src/common/constants';
import { EscrowClient } from '@human-protocol/sdk';
import { Web3Service } from '../web3/web3.service';
import { ErrorManifest, ErrorSlack } from 'src/common/constants/errors';
import { AbuseDecision, AbuseStatus } from 'src/common/enums/abuse';
import { firstValueFrom } from 'rxjs';
import { ServerConfigService } from 'src/common/config/server-config.service';

@Injectable()
export class AbuseService {
  private readonly logger = new Logger(AbuseService.name);
  private readonly synapsBaseURL: string;

  constructor(
    private abuseRepository: AbuseRepository,
    private readonly httpService: HttpService,
    private readonly web3Service: Web3Service,
    private readonly serverConfigService: ServerConfigService,
    private readonly slackConfigService: SlackConfigService,
  ) {}

  public async createAbuse(
    data: ReportAbuseDto,
    userId: number,
  ): Promise<void> {
    const abuseEntity = new AbuseEntity();
    abuseEntity.escrowAddress = data.escrowAddress;
    abuseEntity.chainId = data.chainId;
    abuseEntity.userId = userId;

    await this.abuseRepository.createUnique(abuseEntity);
    return;
  }

  public async sendSlackNotification(abuseEntity: AbuseEntity): Promise<void> {
    const signer = this.web3Service.getSigner(abuseEntity.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const manifestUrl = await escrowClient.getManifestUrl(
      abuseEntity.escrowAddress,
    );
    if (!manifestUrl) {
      this.logger.log(ErrorManifest.ManifestUrlDoesNotExist, AbuseService.name);
      throw new Error(ErrorManifest.ManifestUrlDoesNotExist);
    }

    if (this.slackConfigService.webhookUrl !== SLACK_WEBHOOK_DISABLED) {
      await firstValueFrom(
        await this.httpService.post(this.slackConfigService.webhookUrl, {
          text: 'New abuse report received!',
          attachments: [
            {
              title: 'Escrow',
              fields: [
                {
                  title: 'Address',
                  value: abuseEntity.escrowAddress,
                },
                {
                  title: 'ChainId',
                  value: abuseEntity.chainId,
                },
                {
                  title: 'Manifest',
                  value: manifestUrl,
                },
              ],
            },
            {
              fallback: 'Actions',
              title: 'Actions',
              callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
              color: '#3AA3E3',
              attachment_type: 'default',
              actions: [
                {
                  name: 'accept',
                  text: 'Accept',
                  type: 'button',
                  value: AbuseDecision.ACCEPTED,
                },
                {
                  name: 'reject',
                  text: 'Reject',
                  type: 'button',
                  value: AbuseDecision.REJECTED,
                },
              ],
            },
          ],
        }),
      );
    }
  }

  public async receiveSlackInteraction(data: any): Promise<string> {
    const callbackId = (data.callback_id as string).split('-');
    const escrowAddress = callbackId[0];
    const chainId = Number(callbackId[1]);

    const abuseEntity =
      await this.abuseRepository.findOneByChainIdAndEscrowAddress(
        chainId,
        escrowAddress,
      );
    if (!abuseEntity) throw new BadRequestException(ErrorSlack.AbuseNotFound);

    abuseEntity.decision = data.actions[0].value;
    abuseEntity.retriesCount = 0;

    await this.abuseRepository.updateOne(abuseEntity);

    return `Abuse ${(data.actions[0].value as string).toLowerCase()}. Escrow: ${escrowAddress}, ChainId: ${chainId}`;
  }

  /**
   * Handles errors that occur during abuse processing.
   * It logs the error and, based on retry count, updates the abuse status accordingly.
   * @param abuseEntity - The entity representing the abuse data.
   * @param error - The error object thrown during processing.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async handleAbuseError(abuseEntity: AbuseEntity): Promise<void> {
    if (abuseEntity.retriesCount >= this.serverConfigService.maxRetryCount) {
      abuseEntity.status = AbuseStatus.FAILED;
    } else {
      abuseEntity.waitUntil = new Date();
      abuseEntity.retriesCount = abuseEntity.retriesCount + 1;
    }
    this.abuseRepository.updateOne(abuseEntity);
  }
}
