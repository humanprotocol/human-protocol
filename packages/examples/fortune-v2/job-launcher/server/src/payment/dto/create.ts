import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { IPaymentCreateDto } from "../interfaces";
import { Currency, MethodType } from "../../common/decorators";

export class PaymentCreateDto implements IPaymentCreateDto {
  @ApiProperty()
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
