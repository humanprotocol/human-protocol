import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, isNumber, Min } from "class-validator";
import { IPaymentCreateDto } from "../interfaces";
import { Currency, MethodType } from "../../common/decorators";

export class PaymentCreateDto implements IPaymentCreateDto {
  @ApiProperty()
  @IsNumber()
  @Min(10)
  public amount: number

  @ApiProperty({
    enum: Currency,
  })
  @IsEnum(Currency)
  public currency: string

  @ApiProperty({
    enum: MethodType,
  })
  @IsEnum(MethodType)
  public paymentMethodType: string
}
