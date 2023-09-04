import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
} from '../../common/enums/payment';
import { ChainId } from '@human-protocol/sdk';

export class PaymentFiatConfirmDto {
  @ApiProperty()
  @IsString()
  public paymentId: string;
}

export class PaymentFiatCreateDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.5)
  public amount: number;

  @ApiProperty({
    enum: Currency,
  })
  @IsEnum(Currency)
  public currency: Currency;
}

export class PaymentCryptoCreateDto {
  @ApiProperty({
    enum: ChainId,
  })
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public transactionHash: string;
}

export class PaymentCreateDto {
  public transaction?: string;
  public amount?: number;
  public currency?: string;
  public source?: PaymentSource;
  public userId?: number;
  public rate?: number;
  public type?: PaymentType;
  public chainId?: number;
  public status?: PaymentStatus;
  public jobId?: number;
}

export class GetRateDto {
  @ApiProperty()
  @IsString()
  public from: string;

  @ApiProperty()
  @IsString()
  public to: string;
}
