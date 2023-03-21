import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, isNumber, Min } from "class-validator";
import { Currency, MethodType } from "../../common/enums/currencies";
import { IPaymentCreateDto } from "../interfaces";

export class PaymentCreateDto implements IPaymentCreateDto {
  @ApiProperty()
  @IsNumber()
  @Min(10)
  public amount: number;

  @ApiProperty({
    enum: Currency,
  })
  @IsEnum(Currency)
  public currency: string;

  @ApiProperty({
    enum: MethodType,
  })
  @IsEnum(MethodType)
  public paymentMethodType: string;
}
