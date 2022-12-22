mport { INetworkDto } from "./network";
 import { IStakingDto } from "./staking";

 export interface ILiquidityDto {
   network: INetworkDto;
   liquidity: number;
   symbol: string;
 }