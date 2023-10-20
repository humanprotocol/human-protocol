import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  StakingClient,
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
import { ISolution } from 'src/common/interfaces/job';
import { ConfigNames } from '../../common/config';
import {
  ESCROW_FAILED_ENDPOINT,
  HEADER_SIGNATURE_KEY,
} from '../../common/constant';
import { EventType } from '../../common/enums/webhook';
import { signMessage } from '../../common/utils/signature';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  EscrowFailedWebhookDto,
  InvalidJobDto,
  JobDetailsDto,
} from './job.dto';

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
    @Inject(StorageService)
    private readonly storageService: StorageService,
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
      const stakingClient = await StakingClient.build(signer);
      const leader = await stakingClient.getLeader(jobLauncherAddress);
      const jobLauncherWebhookUrl = leader?.webhookUrl;

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
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
      escrowAddress,
    );

    const stakingClient = await StakingClient.build(signer);
    const leader = await stakingClient.getLeader(recordingOracleAddress);

    const recordingOracleWebhookUrl = leader?.webhookUrl;
    if (!recordingOracleWebhookUrl)
      throw new NotFoundException('Unable to get Recording Oracle webhook URL');

    const solutionsUrl = await this.addSolution(
      chainId,
      escrowAddress,
      workerAddress,
      signer.address,
      solution,
    );

    await this.sendWebhook(recordingOracleWebhookUrl, {
      escrowAddress: escrowAddress,
      chainId: chainId,
      solutionsUrl: solutionsUrl,
    });
  }

  private async addSolution(
    chainId: ChainId,
    escrowAddress: string,
    workerAddress: string,
    exchangeAddress: string,
    solution: string,
  ): Promise<string> {
    const existingJobSolutions = await this.storageService.downloadJobSolutions(
      escrowAddress,
      chainId,
    );

    if (
      existingJobSolutions.find(
        (solution) => solution.workerAddress === workerAddress,
      )
    ) {
      throw new BadRequestException('User has already submitted a solution');
    }

    const newJobSolutions: ISolution[] = [
      ...existingJobSolutions,
      {
        workerAddress: workerAddress,
        solution: solution,
      },
    ];

    const url = await this.storageService.uploadJobSolutions(
      exchangeAddress,
      escrowAddress,
      chainId,
      newJobSolutions,
    );

    return url;
  }

  public async processInvalidJobSolution(
    invalidJobSolution: InvalidJobDto,
  ): Promise<void> {
    const existingJobSolutions = await this.storageService.downloadJobSolutions(
      invalidJobSolution.escrowAddress,
      invalidJobSolution.chainId,
    );

    const foundSolution = existingJobSolutions.find(
      (sol) => sol.workerAddress === invalidJobSolution.workerAddress,
    );

    if (foundSolution) {
      foundSolution.invalid = true;
    } else {
      throw new BadRequestException(
        `Solution not found in Escrow: ${invalidJobSolution.escrowAddress}`,
      );
    }

    await this.storageService.uploadJobSolutions(
      this.web3Service.getSigner(invalidJobSolution.chainId).address,
      invalidJobSolution.escrowAddress,
      invalidJobSolution.chainId,
      existingJobSolutions,
    );
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
}
