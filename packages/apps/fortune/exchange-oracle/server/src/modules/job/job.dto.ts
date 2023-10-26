import { ApiProperty } from '@nestjs/swagger';
import { ChainId } from '@human-protocol/sdk';
import { IsEnum, IsString } from 'class-validator';
import { IsValidEthereumAddress } from '../../common/validators';
import { EventType } from '../../common/enums/webhook';

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
  public workerAddress: string;

  @ApiProperty()
  @IsString()
  public solution: string;
}

export class InvalidJobDto {
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
  workerAddress: string;
}

export class EscrowFailedWebhookDto {
  public chain_id: ChainId;
  public escrow_address: string;
  public event_type: EventType;
  public reason: string;
}
