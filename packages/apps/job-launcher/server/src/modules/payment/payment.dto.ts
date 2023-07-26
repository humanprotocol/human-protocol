import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import {
  Currency,
  PaymentSource,
  PaymentType,
  TokenId,
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
  @Min(10)
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
  public transactionHash?: string;
  public amount?: string;
  public currency?: string;
  public source?: PaymentSource;
  public userId?: number;
  public rate?: number;
  public type?: PaymentType;
}

export class GetRateDto {
  @ApiProperty({
    enum: TokenId,
  })
  @IsEnum(TokenId)
  public token: TokenId;

  @ApiProperty({
    enum: Currency,
  })
  @IsEnum(Currency)
  public currency: Currency;
}
