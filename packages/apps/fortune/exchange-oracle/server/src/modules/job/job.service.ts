import {
  EscrowClient,
  EscrowStatus,
  InitClient,
  KVStoreClient,
  KVStoreKeys,
  StorageClient,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Web3Service } from '../web3/web3.service';
import { JobDetailsDto } from './job.dto';

@Injectable()
export class JobService {
  public readonly logger = new Logger(JobService.name);
  private storage: {
    [key: string]: string[];
  } = {};

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {}

  public async getDetails(
    chainId: number,
    escrowAddress: string,
  ): Promise<JobDetailsDto> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = new EscrowClient(await InitClient.getParams(signer));
    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    const manifest = await StorageClient.downloadFileFromUrl(manifestUrl);

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
    const escrowClient = new EscrowClient(await InitClient.getParams(signer));
    const escrows = await escrowClient.getEscrowsFiltered({
      status: EscrowStatus.Pending,
    });

    return escrows.filter(
      (escrow) => !this.storage[escrow]?.includes(workerAddress),
    );
  }

  public async solveJob(
    chainId: number,
    escrowAddress: string,
    workerAddress: string,
    solution: string,
  ): Promise<boolean> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = new EscrowClient(await InitClient.getParams(signer));
    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
      escrowAddress,
    );
    const kvstore = new KVStoreClient(await InitClient.getParams(signer));
    const recordingOracleURL = await kvstore.get(
      recordingOracleAddress,
      KVStoreKeys.webhook_url,
    );

    if (!this.storage[escrowAddress]) {
      this.storage[escrowAddress] = [];
    }
    this.storage[escrowAddress].push(workerAddress);

    await this.httpService.post(
      recordingOracleURL || 'http://localhost:3005/' + '/job/solve',
      {
        escrowAddress: escrowAddress,
        chainId: chainId,
        exchangeAddress: signer.address,
        workerAddress: workerAddress,
        solution: solution,
      },
    );

    return true;
  }
}
