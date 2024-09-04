import { Expose } from 'class-transformer';
import { IsEnum, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';

export class EscrowDto {
  @ApiProperty({ example: ChainId.POLYGON_AMOY })
  @IsEnum(ChainId)
  @Expose()
  public chainId: ChainId;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  @Expose()
  public address: string;

  @ApiProperty({ example: '0.07007358932392' })
  @IsString()
  @Expose()
  public balance: string;

  @ApiProperty({ example: 'HMT' })
  @IsString()
  @Expose()
  public token: string;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  @Expose()
  public factoryAddress: string;

  @ApiProperty({ example: '0.07007358932392' })
  @IsString()
  @Expose()
  public totalFundedAmount: string;

  @ApiProperty({ example: '0.07007358932392' })
  @IsString()
  @Expose()
  public amountPaid: string;

  @ApiProperty({ example: 'Launched' })
  @IsString()
  @Expose()
  public status: string;

  @ApiProperty({ example: 'https://example.test/manifest' })
  @IsUrl()
  @Expose()
  public manifest?: string;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  @Expose()
  public launcher: string;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  @Expose()
  public exchangeOracle?: string;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  @Expose()
  public recordingOracle?: string;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  @Expose()
  public reputationOracle?: string;

  @ApiProperty({ example: 'https://example.test/final-results' })
  @IsUrl()
  @Expose()
  public finalResultsUrl?: string;
}

export class EscrowPaginationDto {
  @ApiProperty({ example: ChainId.POLYGON_AMOY })
  @IsEnum(ChainId)
  @Expose()
  public chainId: ChainId;

  @ApiProperty({ example: '0xb794f5ea0ba39494ce839613fffba74279579268' })
  @IsString()
  @Expose()
  public address: string;

  @ApiProperty({ example: 'Launched' })
  @IsString()
  @Expose()
  public status: string;
}
