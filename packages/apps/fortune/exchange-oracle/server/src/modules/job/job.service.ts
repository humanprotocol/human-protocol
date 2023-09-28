import {
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  KVStoreClient,
  KVStoreKeys,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { Web3Service } from '../web3/web3.service';
import { EscrowFailedWebhookDto, JobDetailsDto } from './job.dto';
import { EventType } from '../../common/enums/webhook';
import { signMessage } from '../../common/utils/signature';
import { HEADER_SIGNATURE_KEY } from '../../common/constant';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  private storage: {
    [key: string]: string[];
  } = {};

  constructor(
    private readonly configService: ConfigService,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {}

  public async getDetails(
    chainId: number,
    escrowAddress: string,
  ): Promise<JobDetailsDto> {
    const reputationOracleURL = this.configService.get(
      ConfigNames.REPUTATION_ORACLE_URL,
    );

    if (!reputationOracleURL)
      throw new NotFoundException('Unable to get Reputation Oracle URL');

    const manifest = await this.httpService.axiosRef
      .get<any>(
        reputationOracleURL +
          `/manifest?chainId=${chainId}&escrowAddress=${escrowAddress}`,
      )
      .then((res) => res.data);

    if (!manifest) {
      const signer = this.web3Service.getSigner(chainId);
      const escrowClient = await EscrowClient.build(signer);
      const jobLauncherAddress = await escrowClient.getJobLauncherAddress(
        escrowAddress,
      );
      const kvstore = await KVStoreClient.build(signer);
      const jobLauncherWebhookUrl = await kvstore.get(
        jobLauncherAddress,
        KVStoreKeys.webhook_url,
      );
      const body: EscrowFailedWebhookDto = {
        escrow_address: escrowAddress,
        chain_id: chainId,
        event_type: EventType.TASK_CREATION_FAILED,
        reason: 'Unable to get manifest',
      };
      const signedBody = await signMessage(
        body,
        this.configService.get(ConfigNames.WEB3_PRIVATE_KEY)!,
      );
      await this.httpService.post(
        jobLauncherWebhookUrl + '/fortune/escrow-failed-webhook',
        body,
        { headers: { [HEADER_SIGNATURE_KEY]: signedBody } },
      );
      throw new NotFoundException('Unable to get manifest');
    }

    return {
      escrowAddress,
      chainId,
      manifest: {
        title: manifest.title,
        description: manifest.description,
        fortunesRequested: manifest.fortunesRequired,
        fundAmount: manifest.fundAmount,
      },
    };
  }

  public async getPendingJobs(
    chainId: number,
    workerAddress: string,
  ): Promise<string[]> {
    const escrows = await EscrowUtils.getEscrows({
      status: EscrowStatus.Pending,
      networks: [chainId],
    });

    return escrows
      .filter(
        (escrow) => !this.storage[escrow.address]?.includes(workerAddress),
      )
      .map((escrow) => escrow.address);
  }

  public async solveJob(
    chainId: number,
    escrowAddress: string,
    workerAddress: string,
    solution: string,
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

    if (
      this.storage[escrowAddress] &&
      this.storage[escrowAddress].includes(workerAddress)
    )
      throw new BadRequestException('User has already submitted a solution');

    if (!this.storage[escrowAddress]) {
      this.storage[escrowAddress] = [];
    }
    this.storage[escrowAddress].push(workerAddress);

    await this.httpService.post(recordingOracleWebhookUrl, {
      escrowAddress: escrowAddress,
      chainId: chainId,
      exchangeAddress: signer.address,
      workerAddress: workerAddress,
      solution: solution,
    });

    return true;
  }
}
