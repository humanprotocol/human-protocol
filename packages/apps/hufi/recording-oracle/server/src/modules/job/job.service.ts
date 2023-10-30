import { 
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  KVStoreClient,
  KVStoreKeys,
  StakingClient,
  StorageClient
 } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { GraphQLClient, gql } from 'graphql-request';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BigNumber, ethers } from 'ethers';
import * as Minio from 'minio';

import {
  ConfigNames,
  ServerConfigType,
  Web3ConfigType,
  serverConfigKey,
  web3ConfigKey,
} from '../../common/config';
import { ErrorJob } from '../../common/constants/errors';
import { JobRequestType, SolutionError } from '../../common/enums/job';
import { ILiquidityScore, ILiquidityScoreFile, IManifest } from '../../common/interfaces/job';
import { checkCurseWords } from '../../common/utils/curseWords';
import { sendWebhook } from '../../common/utils/webhook';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { CampaignManifestDto, EscrowFailedWebhookDto, liquidityRequestDto, liquidityScores } from './job.dto';
import { ESCROW_FAILED_ENDPOINT, EXCHANGE_INVALID_ENDPOINT, HEADER_SIGNATURE_KEY } from '../../common/constants';
import { EventType } from '@/common/enums/webhook';
import { ConfigService } from '@nestjs/config';
import { signMessage } from '@/common/utils/signature';

@Injectable()
export class JobService {

  public readonly logger = new Logger(JobService.name);
  public readonly minioClient: Minio.Client;

  constructor(
    private readonly configService: ConfigService,
    @Inject(serverConfigKey)
    private serverConfig: ServerConfigType,
    @Inject(web3ConfigKey)
    private web3Config: Web3ConfigType,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly httpService: HttpService,
  ) {}

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

  private async sendWebhook(url: string, body: any): Promise<void> {
    const signedBody = await signMessage(
      body,
      this.configService.get(ConfigNames.WEB3_PRIVATE_KEY)!,
    );
    await this.httpService.post(url, body, {
      headers: { [HEADER_SIGNATURE_KEY]: signedBody },
    });
  }

  public async getLiquidityScore(liquidityRequest: liquidityRequestDto): Promise<any> {
    const  UniswapQuery = gql`
                  query GetPositionSnapshots($user: Bytes!, $startTime: Int!, $endTime: Int!) {
                    positionSnapshots(
                      where: {position_: {account: $user}, timestamp_gte: $startTime, timestamp_lte: $endTime}
                      orderBy: timestamp
                      orderDirection: asc
                    ) {
                      id
                      timestamp
                      position {
                        id
                        liquidity
                        pool {
                          id
                          totalLiquidity
                          inputTokens {
                            symbol
                            decimals
                          }
                        }
                        withdrawCount
                        depositCount
                        timestampClosed
                        timestampOpened
                      }
                    }
                    
                  }
                  `;

    let client;
  
    try {
      const request: CampaignManifestDto = await this.getManifest(liquidityRequest.chainId,liquidityRequest.escrowAddress)
      let [exchange, chain] = request.exchangeName.split("-");
      const variables = {
        user: liquidityRequest.liquidityProvider,
        startTime: request.startBlock,
        endTime: request.endBlock,
        token0: request.tokenA,
        token1: request.tokenB,
        exchange : exchange,
        chain: chain
      };

      if(variables.chain == "ethereum" && variables.exchange == "uniswap"){
        client = new GraphQLClient( this.configService.get(ConfigNames.UniswapEthereumEndpoint)!);
      }
      else if(variables.chain == "polygon" && variables.exchange == "uniswap"){
        client = new GraphQLClient(this.configService.get(ConfigNames.UniswapPolygonEndpoint)!);
      }
      else if(variables.chain == "bsc" && variables.exchange == "pancakeswap"){
        client = new GraphQLClient(this.configService.get(ConfigNames.pancakeSwapEndpoint)!);
      }
  
      const result:any = await client?.request(UniswapQuery, variables);
      let positionSnapshots = result?.positionSnapshots;
  
      const filteredSnapshots = this.filterObjectsByInputTokenSymbol(positionSnapshots, variables.token0,variables.token1);
      const liquidityScore = this.calculateLiquidityScore(filteredSnapshots);

    if (liquidityRequest.save == false){
      return {  
        "LiquidityScore":liquidityScore,
        "user":liquidityRequest.liquidityProvider,
        };
      }
    else if (liquidityRequest.save==true){
      try{
        await this.processJobLiquidity(liquidityRequest,liquidityScore)
        return {  
          "LiquidityScore":liquidityScore,
          "user":liquidityRequest.liquidityProvider,
          "Message":"Liquidity score has been saved."
          }

    }
     catch(error:any){
      console.error(`Error in getLiquidityScore: ${error.message}`);
      throw error;
     }
    
  }
}

  catch (error: any) {
    console.error(`Error in getLiquidityScore: ${error.message}`);
    throw error;
  }

}

  public calculateLiquidityScore(snapshots: any[]): string {
    let totalScore = BigNumber.from(0);
  
    // Check for no snapshots
    if (snapshots.length === 0) {
        return "0";
    }
  
    // Log snapshot count
    this.logger.debug(`Snapshot count: ${snapshots.length}`);
  
    // Single snapshot case
    if (snapshots.length === 1) {
        totalScore = this.calculateSingleSnapshotScore(snapshots[0]);
    }
    // Multiple snapshots case
    else {
        totalScore = this.calculateMultipleSnapshotsScore(snapshots);
    }
  
    return totalScore.toString();
  }
  
  /**
  * Calculate score for a single snapshot.
  *
  * @param snapshot - The liquidity snapshot.
  * @returns The liquidity score as a BigNumber.
  */
  private calculateSingleSnapshotScore(snapshot: any): BigNumber {
    const totalLiquidity = BigNumber.from(snapshot.position.pool.totalLiquidity);
    const liquidityAmount = BigNumber.from(snapshot.position.liquidity);
    const currentTime = BigNumber.from(Math.floor(Date.now() / 1000));
    const timeWithheld = currentTime.sub(snapshot.timestamp);
  
    
  
    return liquidityAmount.mul(timeWithheld).div(totalLiquidity);
  }
  
  /**
  * Calculate score for multiple snapshots.
  *
  * @param snapshots - Array of liquidity snapshots.
  * @returns The cumulative liquidity score as a BigNumber.
  */
  private calculateMultipleSnapshotsScore(snapshots: any[]): BigNumber {
    let totalScore = BigNumber.from(0);
  
    for (let i = 1; i < snapshots.length; i++) {
        const snapshot = snapshots[i];
        const prevSnapshot = snapshots[i - 1];
  
        // Skip if total liquidity is zero to avoid division by zero
        if (snapshot.position.pool.totalLiquidity === '0') {
            this.logger.warn('Total liquidity is zero, skipping snapshot.');
            continue;
        }
  
        const totalLiquidity = BigNumber.from(snapshot.position.pool.totalLiquidity);
        const liquidityAmount = BigNumber.from(snapshot.position.liquidity);
        const timeWithheld = BigNumber.from(snapshot.timestamp).sub(prevSnapshot.timestamp);
  
  
        const PRECISION = BigNumber.from((10**3).toString()); // Let's try with a higher precision to keep more decimals
  
        const adjustedLiquidity = liquidityAmount.mul(PRECISION);
        const multipliedLiquidity = adjustedLiquidity.mul(timeWithheld);
        const rawScore = multipliedLiquidity.div(totalLiquidity);
        const snapshotScore = rawScore
        console.log(snapshot)
        // Log all steps to find out what's going wrong
        console.log('Adjusted Liquidity:', adjustedLiquidity.toString());
        console.log('Multiplied Liquidity:', multipliedLiquidity.toString());
        console.log('Raw Score:', rawScore.toString());
        console.log('Snapshot Score:', snapshotScore.toString());
  
  
        // const snapshotScore = liquidityAmount.mul(timeWithheld).div(totalLiquidity);
        console.log('Total Liquidity:', totalLiquidity.toString());
        console.log('Liquidity Amount:', liquidityAmount.toString());
        console.log('Time Withheld:', timeWithheld.toString());
  
        
        totalScore = totalScore.add(snapshotScore);
        console.log("total score", snapshotScore.toString())
    }
  
    return totalScore;
  }
  
  
  private filterObjectsByInputTokenSymbol(objects: any[], symbol1: any, symbol2: any){
      return objects.filter((obj: { position: { pool: { inputTokens: any; }; }; }) => {
        const inputTokens = obj.position.pool.inputTokens;
        const firstToken = inputTokens[0]?.symbol;
        const secondToken = inputTokens[1]?.symbol;
        return firstToken === symbol1 && secondToken === symbol2;
      });
    }
  private async processJobLiquidity(
    liquiditySolution: liquidityRequestDto,
    score:string
  ): Promise<string> {
    const signer = this.web3Service.getSigner(liquiditySolution.chainId);
    const escrowClient = await EscrowClient.build(signer);
    const kvstoreClient = await KVStoreClient.build(signer);

    const exchangeOracleAddress = await escrowClient.getExchangeOracleAddress(
      liquiditySolution.escrowAddress,
    );
    const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(
      liquiditySolution.escrowAddress,
    );
    if (
      ethers.utils.getAddress(recordingOracleAddress) !==
      (await signer.getAddress())
    ) {
      this.logger.log(ErrorJob.AddressMismatches, JobService.name);
      throw new BadRequestException(ErrorJob.AddressMismatches);
    }

    const escrowStatus = await escrowClient.getStatus(
      liquiditySolution.escrowAddress,
    );
    if (
      escrowStatus !== EscrowStatus.Pending &&
      escrowStatus !== EscrowStatus.Partial
    ) {
      this.logger.log(ErrorJob.InvalidStatus, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidStatus);
    }

    const manifestUrl = await escrowClient.getManifestUrl(
      liquiditySolution.escrowAddress,
    );
    const manifest: IManifest =
      await this.storageService.download(manifestUrl);

    if (manifest.requestType !== JobRequestType.Campaign) {
      this.logger.log(ErrorJob.InvalidJobType, JobService.name);
      throw new BadRequestException(ErrorJob.InvalidJobType);
    }
    const jobSolutionUploaded = await this.storageService.uploadLiquidityScore(
      exchangeOracleAddress,
      liquiditySolution.escrowAddress,
      liquiditySolution.chainId,
      liquiditySolution.liquidityProvider,
      score
    );
      await escrowClient.storeResults(
        liquiditySolution.escrowAddress,
        jobSolutionUploaded.url,
        jobSolutionUploaded.hash,
      );

    return 'Liquidity Scores are recorded.';
  }
 
}
