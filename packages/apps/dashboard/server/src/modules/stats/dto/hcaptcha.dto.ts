import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HcaptchaStats {
  @ApiProperty({ example: 1000 })
  @IsNumber()
  public served: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  public solved: number;
}

export class HcaptchaDailyStats extends HcaptchaStats {
  @IsString()
  public date: string;
}

export class HcaptchaDailyStatsResponseDto {
  @ApiProperty({ example: '2024-05-01' })
  public from: string;

  @ApiProperty({ example: '2024-05-01' })
  public to: string;

  @ApiProperty({ isArray: true, type: HcaptchaDailyStats })
  public results: HcaptchaDailyStats[];
}
