import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  KVStoreClient,
  StakingClient,
  StorageClient,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
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
import { JobRequestType } from '../../common/enums/job';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  CEXLiquidityRequestDto,
  CampaignManifestDto,
  liquidityDto,
  liquidityRequestDto,
  liquidityResponseDto,
} from './liquidity.dto';
import { ConfigService } from '@nestjs/config';
import { signMessage } from '../../common/utils/signature';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { GraphQLClient, gql } from 'graphql-request';
import crypto from "crypto";

@Injectable()
export class LiquidityService {
  public readonly logger = new Logger(LiquidityService.name);
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
      // const signer = this.web3Service.getSigner(chainId);
      // const escrowClient = await EscrowClient.build(signer);
      // const jobLauncherAddress = await escrowClient.getJobLauncherAddress(
      //   escrowAddress,
      // );
      // const stakingClient = await StakingClient.build(signer);
      // const jobLauncher = await stakingClient.getLeader(jobLauncherAddress);
      // const jobLauncherWebhookUrl = jobLauncher?.webhookUrl;

      // if (!jobLauncherWebhookUrl) {
      //   throw new NotFoundException('Unable to get Job Launcher webhook URL');
      // }

      // const body: EscrowFailedWebhookDto = {
      //   escrow_address: escrowAddress,
      //   chain_id: chainId,
      //   event_type: EventType.TASK_CREATION_FAILED,
      //   reason: 'Unable to get manifest',
      // };
      // await this.sendWebhook(
      //   jobLauncherWebhookUrl + ESCROW_FAILED_ENDPOINT,
      //   body,
      // );
      throw new NotFoundException('Unable to get manifest');
    } else return manifest;
  }

  private getGraphQLClient(chain: string, exchange: string): GraphQLClient {
    if (chain == 'ethereum' && exchange == 'uniswap') {
      return new GraphQLClient(
        this.configService.get(ConfigNames.UniswapEthereumEndpoint)!,
      );
    } else if (chain == 'polygon' && exchange == 'uniswap') {
      return new GraphQLClient(
        this.configService.get(ConfigNames.UniswapPolygonEndpoint)!,
      );
    } else if (chain == 'bsc' && exchange == 'pancakeswap') {
      return new GraphQLClient(
        this.configService.get(ConfigNames.pancakeSwapEndpoint)!,
      );
    }

    throw new BadRequestException(ErrorJob.InvalidExchange);
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

  public async getCEXLiquidityScore(liquidityRequest: CEXLiquidityRequestDto): Promise<string> {
    try {
      const manifest = await this.getManifest(
        liquidityRequest.chainId,
        liquidityRequest.escrowAddress,
      );
  
      if (manifest.requestType !== JobRequestType.Campaign) {
        this.logger.log(ErrorJob.InvalidJobType, LiquidityService.name);
        throw new BadRequestException(ErrorJob.InvalidJobType);
      }
  
      const signer = this.web3Service.getSigner(liquidityRequest.chainId);
      const escrowClient = await EscrowClient.build(signer);
      const escrowStatus = await escrowClient.getStatus(
        liquidityRequest.escrowAddress,
      );
      if (
        escrowStatus !== EscrowStatus.Pending &&
        escrowStatus !== EscrowStatus.Partial
      ) {
        this.logger.log(ErrorJob.InvalidStatus, LiquidityService.name);
        throw new BadRequestException(ErrorJob.InvalidStatus);
      }
  
      const recordingOracleAddress =
        await escrowClient.getRecordingOracleAddress(
          liquidityRequest.escrowAddress,
        );
      
      if (
        ethers.utils.getAddress(recordingOracleAddress) !==
        (await signer.getAddress())
      ) {
        this.logger.log(ErrorJob.AddressMismatches, LiquidityService.name);
        throw new BadRequestException(ErrorJob.AddressMismatches);
      }
  
      const queryString = `timestamp=${Date.now()}&startTime=${manifest.startBlock}`;
      const signature = crypto
        .createHmac('sha256', liquidityRequest.liquidityProviderAPISecret)
        .update(queryString)
        .digest('hex');
      const signedQueryString = `${queryString}&signature=${signature}`;
      const headers = {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      };
      const response = await this.httpService.get(`${ConfigNames.BINANCE_URL}/api/v3/allOrders?${signedQueryString}`, { headers }).toPromise();
      if (!response) {
        throw new Error('Failed to get response from server');
      }
      const data = response.data;
      if (data) {
        const filteredOrders = data.filter(
          (order: any) => order.status === 'FILLED' || order.type === 'LIMIT'
        );
        const liquidityScore = this.calculateCentralizedLiquidityScore(filteredOrders);
        if (liquidityRequest.save) {
          await this.pushLiquidityScore(
            liquidityRequest.escrowAddress,
            liquidityRequest.chainId,
            liquidityRequest.liquidityProvider,
            liquidityScore,
          );
        }
        return liquidityScore;
      }
      throw new Error('No data received from server');
    } catch (error: any) {
      console.error(`Error in getCEXLiquidityScore: ${error.message}`);
      throw error;
    }
  }
  

  public async getDEXLiquidityScore(
    liquidityRequest: liquidityRequestDto,
  ): Promise<any> {
    const UniswapQuery = gql`
      query GetPositionSnapshots(
        $user: Bytes!
        $startTime: Int!
        $endTime: Int!
      ) {
        positionSnapshots(
          where: {
            position_: { account: $user }
            timestamp_gte: $startTime
            timestamp_lte: $endTime
          }
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

    try {
      const manifest = await this.getManifest(
        liquidityRequest.chainId,
        liquidityRequest.escrowAddress,
      );

      if (manifest.requestType !== JobRequestType.Campaign) {
        this.logger.log(ErrorJob.InvalidJobType, LiquidityService.name);
        throw new BadRequestException(ErrorJob.InvalidJobType);
      }

      const signer = this.web3Service.getSigner(liquidityRequest.chainId);
      const escrowClient = await EscrowClient.build(signer);
      const escrowStatus = await escrowClient.getStatus(
        liquidityRequest.escrowAddress,
      );
      if (
        escrowStatus !== EscrowStatus.Pending &&
        escrowStatus !== EscrowStatus.Partial
      ) {
        this.logger.log(ErrorJob.InvalidStatus, LiquidityService.name);
        throw new BadRequestException(ErrorJob.InvalidStatus);
      }

      const recordingOracleAddress =
        await escrowClient.getRecordingOracleAddress(
          liquidityRequest.escrowAddress,
        );
      
      if (
        ethers.utils.getAddress(recordingOracleAddress) !==
        (await signer.getAddress())
      ) {
        this.logger.log(ErrorJob.AddressMismatches, LiquidityService.name);
        throw new BadRequestException(ErrorJob.AddressMismatches);
      }

      let [exchange, chain] = manifest.exchangeName.split('-');
      const variables = {
        user: liquidityRequest.liquidityProvider,
        startTime: manifest.startBlock,
        endTime: manifest.endBlock,
        token0: manifest.tokenA,
        token1: manifest.tokenB,
        exchange,
        chain,
      };

      const client = this.getGraphQLClient(variables.chain, variables.exchange);
      const result: any = await client.request(UniswapQuery, variables);
      let positionSnapshots = result?.positionSnapshots;

      const filteredSnapshots = this.filterObjectsByInputTokenSymbol(
        positionSnapshots,
        variables.token0,
        variables.token1,
      );
      const liquidityScore = this.calculateLiquidityScore(filteredSnapshots);

      if (liquidityRequest.save) {
        try {
          await this.pushLiquidityScore(
            liquidityRequest.escrowAddress,
            liquidityRequest.chainId,
            liquidityRequest.liquidityProvider,
            liquidityScore,
          );
        } catch (error: any) {
          console.error(`Error in getLiquidityScore: ${error.message}`);
          throw error;
        }
      }
      const response: liquidityResponseDto = {
        liquidityScore,
        liquidityProvider: liquidityRequest.liquidityProvider,
      };
      return response;
    } catch (error: any) {
      console.error(`Error in getLiquidityScore: ${error.message}`);
      throw error;
    }
  }

  public calculateLiquidityScore(snapshots: any[]): string {
    let totalScore = BigNumber.from(0);

    // Check for no snapshots
    if (snapshots.length === 0) {
      return '0';
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
    const totalLiquidity = BigNumber.from(
      snapshot.position.pool.totalLiquidity,
    );
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

      const totalLiquidity = BigNumber.from(
        snapshot.position.pool.totalLiquidity,
      );
      const liquidityAmount = BigNumber.from(snapshot.position.liquidity);
      const timeWithheld = BigNumber.from(snapshot.timestamp).sub(
        prevSnapshot.timestamp,
      );

      const PRECISION = BigNumber.from((10 ** 3).toString()); // Let's try with a higher precision to keep more decimals

      const adjustedLiquidity = liquidityAmount.mul(PRECISION);
      const multipliedLiquidity = adjustedLiquidity.mul(timeWithheld);
      const rawScore = multipliedLiquidity.div(totalLiquidity);
      const snapshotScore = rawScore;
      console.log(snapshot);
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
      console.log('total score', snapshotScore.toString());
    }

    return totalScore;
  }

  public calculateCentralizedLiquidityScore(orders: { cummulativeQuoteQty: number; time: number; updateTime: number; }[]): string {
    if (orders.length === 0) {
      return '0';
    }
  
    const totalScore = orders.reduce((acc, order) => {
      console.log('Order: ', order);
      const liquidityAmount = order.cummulativeQuoteQty;
      const timeWithheld = order.time === order.updateTime ? 1 : order.updateTime - order.time;
      const score = liquidityAmount * timeWithheld;
      acc += score;
      console.log('Total Score: ', acc);
      return acc;
    }, 0);
  
    return totalScore.toString();
  }

  private filterObjectsByInputTokenSymbol(
    objects: any[],
    symbol1: any,
    symbol2: any,
  ) {
    return objects.filter(
      (obj: { position: { pool: { inputTokens: any } } }) => {
        const inputTokens = obj.position.pool.inputTokens;
        const firstToken = inputTokens[0]?.symbol;
        const secondToken = inputTokens[1]?.symbol;
        return firstToken === symbol1 && secondToken === symbol2;
      },
    );
  }

  public async pushLiquidityScore(
    escrowAddress: string,
    chainId: ChainId,
    liquidityProvider: string,
    score: string,
  ): Promise<string> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    let liquidities: liquidityDto[];
    const existingLiquiditiesURL: string = await escrowClient.getIntermediateResultsUrl(escrowAddress);
    if (existingLiquiditiesURL) {
      liquidities = JSON.parse(await this.storageService.download(existingLiquiditiesURL));
      if (liquidities) {
        const exisitingLiquidity = liquidities.find((liq) => liq.liquidityProvider === liquidityProvider);
        if (exisitingLiquidity) {
          exisitingLiquidity.liquidityScore = score;
        } else {
          liquidities.push({
            chainId: chainId,
            liquidityProvider: liquidityProvider,
            liquidityScore: score,
          });
        }
      } else {
        throw new NotFoundException(ErrorJob.NotFoundIntermediateResults);
      }

    } else {
      liquidities = [
        {
          chainId,
          liquidityProvider,
          liquidityScore: score,
        }
      ]
    }

    const saveLiquidityResult = await this.storageService.uploadLiquidities(
      escrowAddress,
      chainId,
      liquidities,
    );
    
    if (!existingLiquiditiesURL) {
      await escrowClient.storeResults(
        escrowAddress,
        saveLiquidityResult.url,
        saveLiquidityResult.hash,
      );
    }

    return 'Liquidity Scores are recorded.';
  }
}
