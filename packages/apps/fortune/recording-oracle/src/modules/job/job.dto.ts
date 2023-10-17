import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsEnum, IsString, IsUrl } from 'class-validator';

import { IsValidEthereumAddress } from '@/common/validators';

export class JobSolutionsRequestDto {
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
  @IsUrl()
  public solutionsUrl: string;
}

export class SaveSolutionsDto {
  public url: string;
  public hash: string;
}
