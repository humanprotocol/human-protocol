import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsPositive, IsString } from "class-validator";

export interface ITransactionCommonDto {
  amount?: number;
  hash?: string;
  confirmation?: number;
}

export class TransactionCommonDto implements ITransactionCommonDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  public amount: number;

  @ApiPropertyOptional()
  @IsString()
  public hash: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  public confirmation: number;
}
