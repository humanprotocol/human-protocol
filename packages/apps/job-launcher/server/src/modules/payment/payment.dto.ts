import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  Currency,
  PaymentSortField,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  VatType,
} from '../../common/enums/payment';
import { ChainId } from '@human-protocol/sdk';
import { IsEnumCaseInsensitive } from '../../common/decorators';
import { Country } from '../../common/enums/job';
import { PageOptionsDto } from 'src/common/pagination/pagination.dto';

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
  @IsEnumCaseInsensitive(Currency)
  public currency: Currency;

  @ApiProperty({
    name: 'payment_method_id',
  })
  @IsString()
  public paymentMethodId: string;
}

export class PaymentCryptoCreateDto {
  @ApiProperty({
    enum: ChainId,
    name: 'chain_id',
  })
  @IsEnumCaseInsensitive(ChainId)
  public chainId: ChainId;

  @ApiProperty({ name: 'transaction_hash' })
  @IsString()
  public transactionHash: string;
}

export class CardConfirmDto {
  @ApiProperty({ name: 'payment_id' })
  @IsString()
  public setupId: string;

  @ApiPropertyOptional({ name: 'default_card', default: false })
  @IsBoolean()
  public defaultCard = false;
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
  @ApiPropertyOptional({ name: 'refund_amount' })
  @IsNumber()
  public refundAmount: number;

  @ApiPropertyOptional({ name: 'user_id' })
  @IsNumber()
  public userId: number;

  @ApiPropertyOptional({ name: 'job_id' })
  @IsNumber()
  public jobId: number;
}

export class AddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public city?: string;

  @ApiPropertyOptional({ enum: Country })
  @IsOptional()
  @IsEnum(Country)
  public country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public line?: string;

  @ApiPropertyOptional({ name: 'postal_code' })
  @IsOptional()
  @IsString()
  public postalCode?: string;
}

export class BillingInfoUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  public address?: AddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public vat?: string;

  @ApiPropertyOptional({ name: 'vat_type', enum: VatType })
  @IsOptional()
  @IsEnum(VatType)
  public vatType?: VatType;
}

export class BillingInfoDto extends BillingInfoUpdateDto {
  @ApiProperty()
  @IsString()
  public email?: string;
}

export class PaymentMethodIdDto {
  @ApiProperty({ name: 'payment_method_id' })
  @IsString()
  public paymentMethodId: string;
}

export class CardDto {
  @ApiProperty()
  @IsString()
  public id: string;

  @ApiProperty({ name: 'last_4' })
  @IsString()
  public last4: string;

  @ApiProperty()
  @IsString()
  public brand: string;

  @ApiProperty({ name: 'exp_month' })
  @IsNumber()
  public expMonth: number;

  @ApiProperty({ name: 'exp_year' })
  @IsNumber()
  public expYear: number;

  @ApiProperty()
  @IsBoolean()
  public default: boolean;
}

export class GetPaymentsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    name: 'sort_field',
    enum: PaymentSortField,
    default: PaymentSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(PaymentSortField)
  sortField?: PaymentSortField = PaymentSortField.CREATED_AT;
}

export class PaymentDto {
  @ApiProperty()
  @IsNumber()
  public amount: number;

  @ApiProperty()
  @IsNumber()
  public rate: number;

  @ApiProperty()
  @IsString()
  public currency: string;

  @ApiProperty({ enum: PaymentType })
  @IsEnum(PaymentType)
  public type: PaymentType;

  @ApiProperty({ enum: PaymentSource })
  @IsEnum(PaymentSource)
  public source: PaymentSource;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  public status: PaymentStatus;

  @ApiProperty({
    description:
      'Transaction hash for crypto payments or Stripe payment ID for fiat payments',
  })
  @IsString()
  @IsOptional()
  public transaction?: string;

  @ApiProperty({
    name: 'escrow_address',
    description: 'Escrow address associated with the payment (if applicable)',
  })
  @IsString()
  @IsOptional()
  public escrowAddress?: string;

  @ApiProperty({
    name: 'created_at',
  })
  @IsString()
  public createdAt: string;
}
