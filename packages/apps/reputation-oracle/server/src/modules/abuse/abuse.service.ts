import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { ReportAbuseDto } from './abuse.dto';
import { AbuseEntity } from './abuse.entity';
import { AbuseRepository } from './abuse.repository';
import { SLACK_WEBHOOK_DISABLED } from '../../common/constants';
import { EscrowClient } from '@human-protocol/sdk';
import { Web3Service } from '../web3/web3.service';
import { ErrorManifest, ErrorSlack } from '../../common/constants/errors';
import { AbuseDecision, AbuseStatus } from '../../common/enums/abuse';
import { firstValueFrom } from 'rxjs';
import { ServerConfigService } from '../../common/config/server-config.service';
import { OperatorUtils } from '@human-protocol/sdk';
import { StakingClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { ChainId } from '@human-protocol/sdk';

@Injectable()
export class AbuseService {
  private readonly logger = new Logger(AbuseService.name);
  private readonly synapsBaseURL: string;
  private localStorage: { [key: string]: string } = {};

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
                  text: 'Slash',
                  type: 'button',
                  style: 'primary',
                  value: AbuseDecision.ACCEPTED,
                },
                {
                  name: 'reject',
                  text: 'Reject',
                  type: 'button',
                  style: 'danger',
                  value: AbuseDecision.REJECTED,
                  confirm: {
                    title: 'Cancel abuse',
                    text: `Are you sure you want to cancel slash for escrow ${abuseEntity.escrowAddress}?`,
                    ok_text: 'Yes',
                    dismiss_text: 'No',
                  },
                },
              ],
            },
          ],
        }),
      );
    }
  }

  private async sendAbuseReportModal(abuseEntity: any, trigger_id: string) {
    try {
      const signer = this.web3Service.getSigner(abuseEntity.chainId);
      const escrowClient = await EscrowClient.build(signer);
      const jobLauncherAddress = await escrowClient.getJobLauncherAddress(
        abuseEntity.escrowAddress,
      );
      const maxAmount = (
        await OperatorUtils.getLeader(abuseEntity.chainId, jobLauncherAddress)
      ).amountStaked;

      const result = await firstValueFrom(
        this.httpService.post(
          'https://slack.com/api/views.open',
          {
            trigger_id: trigger_id,
            view: {
              type: 'modal',
              callback_id: `${abuseEntity.escrowAddress}-${abuseEntity.chainId}`,
              title: {
                type: 'plain_text',
                text: 'Confirm slash',
              },
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `Max amount: ${maxAmount}`,
                  },
                },
                {
                  type: 'input',
                  block_id: 'quantity_input',
                  element: {
                    action_id: 'quantity',
                    type: 'number_input',
                    is_decimal_allowed: true,
                    min_value: '0',
                    max_value: maxAmount,
                  },
                  label: {
                    type: 'plain_text',
                    text: 'Please enter the quantity (in HMT):',
                  },
                },
              ],
              submit: {
                type: 'plain_text',
                text: 'Submit',
              },
              close: {
                type: 'plain_text',
                text: 'Cancel',
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.slackConfigService.oauthToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      if (!result.data.ok) {
        console.error('Error sending abuse report modal:', result.data);
      }
    } catch (error) {
      console.error('Error sending abuse report modal:', error);
    }
  }

  private async updateInteractiveMessage(responseUrl: string, text: string) {
    try {
      await firstValueFrom(
        this.httpService.post(responseUrl, {
          text: text,
        }),
      );
    } catch (error) {
      console.error('Error updating interactive message:', error);
    }
  }

  public async slashAccount(
    slasher: string,
    staker: string,
    chainId: ChainId,
    escrowAddress: string,
    amount: number,
  ) {
    const signer = this.web3Service.getSigner(chainId);
    const stakingClient = await StakingClient.build(signer);

    await stakingClient.slash(
      slasher,
      staker,
      escrowAddress,
      BigInt(ethers.parseUnits(amount.toString(), 'ether')),
    );
  }

  public async receiveSlackInteraction(data: any): Promise<string> {
    const callback_id = data.callback_id
      ? data.callback_id
      : data.view.callback_id;
    const callbackId = (callback_id as string).split('-');
    const escrowAddress = callbackId[0];
    const chainId = Number(callbackId[1]);

    const abuseEntity =
      await this.abuseRepository.findOneByChainIdAndEscrowAddress(
        chainId,
        escrowAddress,
      );
    if (!abuseEntity) throw new BadRequestException(ErrorSlack.AbuseNotFound);

    if (
      data.type === 'interactive_message' &&
      data.actions[0].value === AbuseDecision.ACCEPTED
    ) {
      this.localStorage[callback_id] = data.response_url;
      await this.sendAbuseReportModal(abuseEntity, data.trigger_id);
      return '';
    } else if (data.type === 'view_submission') {
      abuseEntity.decision = AbuseDecision.ACCEPTED;
      abuseEntity.amount = data.view.state.values.quantity_input.quantity.value;
      abuseEntity.retriesCount = 0;
      await this.updateInteractiveMessage(
        this.localStorage[callback_id],
        `Abuse ${(abuseEntity.decision as string).toLowerCase()}. Escrow: ${escrowAddress}, ChainId: ${chainId}, Slashed amount: ${abuseEntity.amount} HMT`,
      );
      await this.abuseRepository.updateOne(abuseEntity);
      return '';
    } else {
      abuseEntity.decision = data.actions[0].value;
      abuseEntity.retriesCount = 0;
      await this.abuseRepository.updateOne(abuseEntity);
      return `Abuse ${(abuseEntity.decision as string).toLowerCase()}. Escrow: ${escrowAddress}, ChainId: ${chainId}`;
    }
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
