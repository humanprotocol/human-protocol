import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { IPaymentConfirmDto } from "../interfaces";

export class PaymentConfirmDto implements IPaymentConfirmDto {
  @ApiProperty()
  @IsString()
  public paymentId: string;
}
