import { ApiProperty } from "@nestjs/swagger";
import { ChainId } from "@human-protocol/sdk";
import { IsEnum, IsString } from "class-validator";

import { IsValidEthereumAddress } from "@/common/validators";

export class JobSolutionRequestDto {
  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public exchangeAddress: string;

  @ApiProperty()
  @IsString()
  @IsValidEthereumAddress()
  public workerAddress: string;

  @ApiProperty()
  @IsString()
  public solution: string;
}

export class SendWebhookDto {
  public escrowAddress: string;
  public chainId: number;
}

export class SaveSoulutionsDto {
  public url: string;
  public hash: string;
}
