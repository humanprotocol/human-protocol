/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EscrowClient, EscrowStatus, NETWORKS, StorageClient } from "@human-protocol/sdk";
import axios from "axios";
import { ethers } from "ethers";

import { JobSolutionRequestDto } from "./job.dto";

@Injectable()
export class JobService {
  constructor(private configService: ConfigService) {}

  async processJobSolution(jobSolution: JobSolutionRequestDto): Promise<any> {
    // Initialize Escrow Client
    const network = NETWORKS[jobSolution.chainId];

    const provider = new ethers.providers.JsonRpcProvider(this.configService.get<string>("ethereum.jsonRpcUrl", ""));
    const signer = new ethers.Wallet(this.configService.get<string>("ethereum.privateKey", ""), provider);

    if (!network) {
      throw new Error(`Unsupported chainId: ${jobSolution.chainId}`);
    }

    const escrowClient = new EscrowClient({
      network,
      signerOrProvider: signer,
    });

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
      any
    >;

    if (!fortunesRequired || !reputationOracleUrl) {
      throw new Error("Manifest does not contain the required data");
    }

    // Initialize Storage Client
    const storageClient = new StorageClient(
      {
        accessKey: this.configService.get<string>("storage.accessKey", ""),
        secretKey: this.configService.get<string>("storage.secretKey", ""),
      },
      {
        endPoint: this.configService.get<string>("storage.endPoint", ""),
        port: +this.configService.get<number>("storage.port", 9000),
        useSSL: this.configService.get<boolean>("storage.useSSL", false),
      },
    );
    const bucket = this.configService.get<string>("storage.bucket", "");

    // Download existing solution if any
    const existingJobSolutionsURL = await escrowClient.getResultsUrl(jobSolution.escrowAddress);

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
      await axios.post(`${reputationOracleUrl.replace(/\/+$/, "")}/send-fortunes`, newJobSolutions);
      return "The requested job is completed.";
    }

    return "Solution is recorded.";
  }
}
