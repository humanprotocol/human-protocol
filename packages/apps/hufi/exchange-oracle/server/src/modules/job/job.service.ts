import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  KVStoreClient,
  KVStoreKeys,
  StakingClient,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import {
  ESCROW_FAILED_ENDPOINT,
  HEADER_SIGNATURE_KEY,
} from '../../common/constant';
import { EventType } from '../../common/enums/webhook';
import { signMessage } from '../../common/utils/signature';
import { Web3Service } from '../web3/web3.service';
import {
  EscrowFailedWebhookDto,
  CampaignManifestDto,
  campaignDetailsDto,
} from './job.dto';
import { StorageClient } from '@human-protocol/sdk';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {}

  public async getDetails(
    chainId: number,
    escrowAddress: string,
  ): Promise<campaignDetailsDto> {
    const manifest = await this.getManifest(chainId, escrowAddress);

    return {
      escrowAddress,
      chainId,
      manifest: {
        ...manifest,
      },
    };
  }

  public async getCampaignsList(chainId: number): Promise<string[]> {
    const escrows = await EscrowUtils.getEscrows({
      status: EscrowStatus.Pending,
      networks: [chainId],
      exchangeOracle: this.web3Service.signerAddress,
    });

    return escrows.map((escrow) => escrow.address);
  }

  private async sendWebhook(url: string, body: any): Promise<void> {
    const signedBody = await signMessage(
      body,
      this.configService.get(ConfigNames.WEB3_PRIVATE_KEY)!,
    );
    await this.httpService.post(url, body, {
      headers: { [HEADER_SIGNATURE_KEY]: signedBody },
    });
  }

  private async getManifest(
    chainId: number,
    escrowAddress: string,
  ): Promise<CampaignManifestDto> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    const manifest: CampaignManifestDto =
      await StorageClient.downloadFileFromUrl(manifestUrl);

    if (!manifest) {
      const signer = this.web3Service.getSigner(chainId);
      const escrowClient = await EscrowClient.build(signer);
      const jobLauncherAddress = await escrowClient.getJobLauncherAddress(
        escrowAddress,
      );
      const stakingClient = await StakingClient.build(signer);
      const jobLauncher = await stakingClient.getLeader(jobLauncherAddress);
      const jobLauncherWebhookUrl = jobLauncher?.webhookUrl;

      if (!jobLauncherWebhookUrl) {
        throw new NotFoundException('Unable to get Job Launcher webhook URL');
      }

      const body: EscrowFailedWebhookDto = {
        escrow_address: escrowAddress,
        chain_id: chainId,
        event_type: EventType.TASK_CREATION_FAILED,
        reason: 'Unable to get manifest',
      };
      await this.sendWebhook(
        jobLauncherWebhookUrl + ESCROW_FAILED_ENDPOINT,
        body,
      );
      throw new NotFoundException('Unable to get manifest');
    } else return manifest;
  }

  // public async getLiquidityScore(
  //   chainId: number,
  //   escrowAddress: string,
  //   liquidityProvider: string,
  // ): Promise<any> {
  //   const signer = this.web3Service.getSigner(chainId);
  //   const escrowClient = await EscrowClient.build(signer);
  //   const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
  //     escrowAddress,
  //   );
  //   const kvstore = await KVStoreClient.build(signer);
  //   const recordingOracleWebhookUrl = await kvstore.get(
  //     recordingOracleAddress,
  //     KVStoreKeys.webhook_url,
  //   );

  //   // let [exchangename, chain] = exchange.split("-");

  //   const body = {
  //     user: user,
  //     startblock: startblock,
  //     endblock: endblock,
  //     token0: token0,
  //     token1: token1,
  //     exchange: exchange,
  //   };

  //   try {
  //     const liquidityResponse = await this.httpService
  //       .post(LiquidityScoreoracle + '/job/liquidity', body)
  //       .toPromise();
  //     if (liquidityResponse) {
  //       return {
  //         LiquidityScore: liquidityResponse.data.LiquidityScore,
  //         user: liquidityResponse.data.user,
  //       };
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     throw error; // or handle error appropriately
  //   }
  // }

  public async getLiquidityScore(
    chainId: number,
    escrowAddress: string,
    liquidityProvider: string,
    save: boolean,
  ): Promise<boolean> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
      escrowAddress,
    );

    const kvstore = await KVStoreClient.build(signer);
    const recordingOracleWebhookUrl = await kvstore.get(
      recordingOracleAddress,
      KVStoreKeys.webhook_url,
    );

    if (!recordingOracleWebhookUrl)
      throw new NotFoundException('Unable to get Recording Oracle webhook URL');

    await this.httpService.post(recordingOracleWebhookUrl, {
      escrowAddress,
      chainId,
      exchangeAddress: signer.address,
      liquidityProvider,
      save,
    });

    return true;
  }
}
