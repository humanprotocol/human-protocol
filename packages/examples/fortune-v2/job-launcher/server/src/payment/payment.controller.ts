import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../common/guards";
import { PaymentConfirmDto, PaymentCreateDto } from "./dto";

import { PaymentService } from "./payment.service";

@ApiBearerAuth()
@ApiTags("Payment")
@Controller("/payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(RolesGuard)
  @Post("/")
  public async confirmPayment(@Request() req: any, @Body() data: PaymentConfirmDto): Promise<any> {
    return this.paymentService.confirmPayment(req.user?.id, data);
  }
}
