import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Response } from 'express';
import { IPaymentRequestDto } from './interfaces';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentService: PaymentsService) { }

  @Post()
  createPayments(
    @Res() response: Response,
    @Body() data: IPaymentRequestDto,
  ) {
    return this.paymentService.createPayment(data)
  }
}
