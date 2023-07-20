import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsEthereumAddress, IsString } from 'class-validator';

export class GetManifestQueryDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  @Transform(({ value }) => Number(value))
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  @IsEthereumAddress()
  public escrowAddress: string;
}
