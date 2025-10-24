import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, Validate } from 'class-validator';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import { ExchangeNameValidator } from '@/common/validators';

export class EnrollExchangeApiKeysDto {
  @ApiProperty({ name: 'api_key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  apiKey: string;

  @ApiProperty({ name: 'secret_key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  secretKey: string;
}

export class ExchangeNameParamDto {
  @ApiProperty({
    name: 'exchange_name',
    enum: SUPPORTED_EXCHANGE_NAMES,
  })
  @Expose({ name: 'exchange_name' })
  @Validate(ExchangeNameValidator)
  exchangeName: string;
}
export class EncrollExchangeApiKeysParamsDto extends ExchangeNameParamDto {}

export class EnrollExchangeApiKeysResponseDto {
  @ApiProperty()
  id: number;
}
