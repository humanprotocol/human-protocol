import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class ReportAbuseDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  escrow_address: string;
  @AutoMap()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 80002 })
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
