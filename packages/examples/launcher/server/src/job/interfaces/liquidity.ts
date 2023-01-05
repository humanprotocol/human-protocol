import { INetworkDto } from "./network";

 export interface ILiquidityDto {
   network: INetworkDto;
   liquidity: number;
   symbol: string;
 }