import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { EscrowClient, EscrowStatus, InitClient, StorageClient } from "@human-protocol/sdk";
import { ethers } from "ethers";

import { storageConfigKey, StorageConfigType } from "@/common/config";
import { JobSolutionRequestDto } from "./job.dto";
import { Web3Service } from "../web3/web3.service";

@Injectable()
export class JobService {
  constructor(
    @Inject(storageConfigKey)
    private storageConfig: StorageConfigType,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly httpService: HttpService,
  ) {}

  async processJobSolution(jobSolution: JobSolutionRequestDto): Promise<string> {
    const signer = this.web3Service.getSigner(jobSolution.chainId);
    const escrowClient = new EscrowClient(await InitClient.getParams(signer));

    // Validate if recording oracle address is valid
    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(jobSolution.escrowAddress);

    if (ethers.utils.getAddress(recordingOracleAddress) !== (await signer.getAddress())) {
      throw new Error("Escrow Recording Oracle address mismatches the current one");
    }

    // Validate if the escrow is in the correct state
    const escrowStatus = await escrowClient.getStatus(jobSolution.escrowAddress);
    if (escrowStatus !== EscrowStatus.Pending) {
      throw new Error("Escrow is not in the Pending status");
    }

    // Validate if the escrow has the correct manifest
    const manifestUrl = await escrowClient.getManifestUrl(jobSolution.escrowAddress);
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
    const existingJobSolutionsURL = await escrowClient.getIntermediateResultsUrl(jobSolution.escrowAddress);

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
    await escrowClient.storeResults(jobSolution.escrowAddress, jobSolutionUploaded.url, jobSolutionUploaded.hash);

    // If number of solutions is equeal to the number required, call Reputation Oracle webhook.
    if (newJobSolutions.length === fortunesRequired) {
      await this.httpService.post(`${reputationOracleUrl.replace(/\/+$/, "")}/send-fortunes`, newJobSolutions);
      return "The requested job is completed.";
    }

    return "Solution is recorded.";
  }
}
