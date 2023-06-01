import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString } from "class-validator";
import { ChainId } from "@human-protocol/sdk";

export class ReputationCreateDto {
  @ApiPropertyOptional()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiPropertyOptional()
  @IsString()
  public escrowAddress: string;
}

export class ReputationUpdateDto {
  @ApiProperty()
  @IsNumber()
  public reputationPoints: number;
}