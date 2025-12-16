import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { SupportedExchange } from '@/common/constants';

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
    enum: SupportedExchange,
  })
  @IsEnum(SupportedExchange)
  exchangeName: SupportedExchange;
}

export class EnrollExchangeApiKeysResponseDto {
  @ApiProperty()
  id: number;
}

export class EnrolledApiKeyDto {
  @ApiProperty({ name: 'exchange_name' })
  exchangeName: string;

  @ApiProperty({ name: 'api_key' })
  apiKey: string;
}

export class SupportedExchangeDto {
  @ApiProperty({ name: 'name' })
  name: string;

  @ApiProperty({ name: 'display_name' })
  displayName: string;
}
