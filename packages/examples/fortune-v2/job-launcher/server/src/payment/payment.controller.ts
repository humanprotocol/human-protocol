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
  public async createPaymentIntent(@Request() req: any, @Body() data: PaymentCreateDto): Promise<any> {
    return this.paymentService.createPaymentIntent(req.user?.stripeCustomerId, data);
  }

  @UseGuards(RolesGuard)
  @Post("/confirm-payment")
  public async confirmPayment(@Request() req: any, @Body() data: PaymentConfirmDto): Promise<boolean> {
    return this.paymentService.confirmPayment(req.user?.id, data);
  }
}
