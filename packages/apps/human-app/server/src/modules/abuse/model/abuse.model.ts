import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEthereumAddress, IsNumber } from 'class-validator';

export class ReportAbuseDto {
  @AutoMap()
  @IsEthereumAddress()
  @ApiProperty()
  escrow_address: string;
  @AutoMap()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty()
  chain_id: number;
}

export class ReportAbuseParams {
  @AutoMap()
  chainId: number;
  @AutoMap()
  escrowAddress: string;
}
export class ReportAbuseCommand {
  @AutoMap()
  data: ReportAbuseParams;
  @AutoMap()
  token: string;
}

export class ReportAbuseData {
  @AutoMap()
  escrow_address: string;
  @AutoMap()
  chain_id: number;
}

export class ReportedAbuseItem {
  id: number;
  escrowAddress: string;
  chainId: number;
  status: string;
}

export class ReportedAbuseResponse {
  results: ReportedAbuseItem[];
}
