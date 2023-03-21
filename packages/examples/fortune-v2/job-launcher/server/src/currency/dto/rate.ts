import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { CoingeckoId, Currency } from "../../common/enums/currencies";
import { IGetRateDto } from "../interfaces";

export class GetRateDto implements IGetRateDto {
  @ApiProperty({
    enum: CoingeckoId,
  })
  @IsEnum(CoingeckoId)
  public token: string;

  @ApiProperty({
    enum: Currency,
  })
  @IsEnum(Currency)
  public currency: string;
}
