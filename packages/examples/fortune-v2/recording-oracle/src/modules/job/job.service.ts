import { Inject, Injectable } from "@nestjs/common";
import { EscrowClient, EscrowStatus, InitClient, StorageClient } from "@human-protocol/sdk";
import axios from "axios";
import { ethers } from "ethers";

import { ethereumConfigKey, EthereumConfigType, storageConfigKey, StorageConfigType } from "@/common/config";
import { JobSolutionRequestDto } from "./job.dto";

@Injectable()
export class JobService {
  private escrowClient: EscrowClient;
  private signer: ethers.Wallet;

  constructor(
    @Inject(ethereumConfigKey)
    private ethereumConfig: EthereumConfigType,
    @Inject(storageConfigKey)
    private storageConfig: StorageConfigType,
  ) {
    this.initEscrowClient();
  }

  async initEscrowClient() {
    const provider = new ethers.providers.JsonRpcProvider(this.ethereumConfig.jsonRpcUrl);
    this.signer = new ethers.Wallet(this.ethereumConfig.privateKey, provider);

    this.escrowClient = new EscrowClient(await InitClient.getParams(provider));
  }

  async processJobSolution(jobSolution: JobSolutionRequestDto): Promise<string> {
    // Validate if recording oracle address is valid
    const recordingOracleAddress = await this.escrowClient.getRecordingOracleAddress(jobSolution.escrowAddress);

    if (ethers.utils.getAddress(recordingOracleAddress) !== (await this.signer.getAddress())) {
      throw new Error("Escrow Recording Oracle address mismatches the current one");
    }

    // Validate if the escrow is in the correct state
    const escrowStatus = await this.escrowClient.getStatus(jobSolution.escrowAddress);
    if (escrowStatus !== EscrowStatus.Pending) {
      throw new Error("Escrow is not in the Pending status");
    }

    // Validate if the escrow has the correct manifest
    const manifestUrl = await this.escrowClient.getManifestUrl(jobSolution.escrowAddress);
    const { fortunesRequired, reputationOracleUrl } = (await StorageClient.downloadFileFromUrl(manifestUrl)) as Record<
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >;

    if (!fortunesRequired || !reputationOracleUrl) {
      throw new Error("Manifest does not contain the required data");
    }

    // Initialize Storage Client
    const storageClient = new StorageClient(
      {
        accessKey: this.storageConfig.accessKey,
        secretKey: this.storageConfig.secretKey,
      },
      {
        endPoint: this.storageConfig.endPoint,
        port: this.storageConfig.port,
        useSSL: this.storageConfig.useSSL,
      },
    );
    const bucket = this.storageConfig.bucket;

    // Download existing solution if any
    const existingJobSolutionsURL = await this.escrowClient.getResultsUrl(jobSolution.escrowAddress);

    const existingJobSolutions = await StorageClient.downloadFileFromUrl(existingJobSolutionsURL).catch(() => []);

    // Validate if the solution is unique
    if (existingJobSolutions.find(({ solution }: { solution: string }) => solution === jobSolution.solution)) {
      throw new Error("Solution already exists");
    }

    // Save new solution to S3
    const newJobSolutions = [
      ...existingJobSolutions,
      {
        exchangeAddress: jobSolution.exchangeAddress,
        workerAddress: jobSolution.workerAddress,
        solution: jobSolution.solution,
      },
    ];

    const [jobSolutionUploaded] = await storageClient.uploadFiles([newJobSolutions], bucket);

    // Save solution URL/HASH on-chain
    await this.escrowClient.storeResults(jobSolution.escrowAddress, jobSolutionUploaded.url, jobSolutionUploaded.hash);

    // If number of solutions is equeal to the number required, call Reputation Oracle webhook.
    if (newJobSolutions.length === fortunesRequired) {
      await axios.post(`${reputationOracleUrl.replace(/\/+$/, "")}/send-fortunes`, newJobSolutions);
      return "The requested job is completed.";
    }

    return "Solution is recorded.";
  }
}
