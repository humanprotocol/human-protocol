import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsEnum, IsString, IsUrl } from 'class-validator';

import { IsValidEthereumAddress } from '@/common/validators';

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
  @IsUrl()
  public solutionUrl: string;
}

export class SendWebhookDto {
  public escrowAddress: string;
  public chainId: number;
}

export class SaveSolutionsDto {
  public url: string;
  public hash: string;
}
