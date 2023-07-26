import {
  EscrowClient,
  EscrowStatus,
  KVStoreClient,
  KVStoreKeys,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { Web3Service } from '../web3/web3.service';
import { JobDetailsDto } from './job.dto';

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
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const escrows = await escrowClient.getEscrowsFiltered({
      status: EscrowStatus.Pending,
    });

    return escrows.filter(
      (escrow: string) => !this.storage[escrow]?.includes(workerAddress),
    );
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
    })

    return true;
  }
}
