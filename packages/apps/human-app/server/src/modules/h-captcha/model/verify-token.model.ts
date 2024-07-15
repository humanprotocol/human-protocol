import { AutoMap } from '@automapper/classes';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTokenDto {
  @AutoMap()
  @IsString()
  @ApiProperty()
  token: string;
}
export class VerifyTokenCommand {
  @AutoMap()
  response: string;
  @AutoMap()
  sitekey: string;
  @AutoMap()
  secret: string;
  @AutoMap()
  jwtToken: string;
}
export class VerifyTokenParams {
  @AutoMap()
  secret: string;
  @AutoMap()
  sitekey: string;
  @AutoMap()
  response: string;
}

export class VerifyTokenApiResponse {
  success: boolean;
  'error-codes'?: string[];
}
export class VerifyTokenResponse {
  constructor(message: string) {
    this.message = message;
  }
  message: string;
}
