import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { Currency } from '../../common/enums/payment';
import { ChainId } from '@human-protocol/sdk';
import { IsEnumWithMetadata } from '../../common/utils/enums';

export class PaymentFiatConfirmDto {
  @ApiProperty({ name: 'payment_id' })
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
  @IsEnumWithMetadata(Currency)
  public currency: Currency;
}

export class PaymentCryptoCreateDto {
  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnumWithMetadata(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'transaction_hash' })
  @IsString()
  public transactionHash: string;
}

export class GetRateDto {
  @ApiProperty()
  @IsString()
  public from: string;

  @ApiProperty()
  @IsString()
  public to: string;
}

export class PaymentRefundCreateDto {
  @IsNumber()
  public refundAmount: number;

  @IsNumber()
  public userId: number;

  @IsNumber()
  public jobId: number;
}
