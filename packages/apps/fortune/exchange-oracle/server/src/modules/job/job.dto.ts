import { ChainId } from '@human-protocol/sdk';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { IsValidEthereumAddress } from '../../common/validators';

export class ManifestDto {
  requesterTitle: string;
  requesterDescription: string;
  submissionsRequired: number;
  fundAmount: number;
}

export class JobDetailsDto {
  escrowAddress: string;
  chainId: number;
  manifest: ManifestDto;
}

export class SolveJobDto {
  @ApiProperty({ name: 'escrow_address' })
  @IsString()
  @IsValidEthereumAddress()
  public escrowAddress: string;

  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'worker_address' })
  @IsString()
  @IsValidEthereumAddress()
  public workerAddress: string;

  @ApiProperty()
  @IsString()
  public solution: string;
}
