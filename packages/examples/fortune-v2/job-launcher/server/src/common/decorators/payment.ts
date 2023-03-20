import { IBase } from "../decorators/base";
import { Currency, PaymentStatus } from "../enums/payment";

export interface IPayment extends IBase {
  paymentId: string;
  amount: number;
  clientSecret: string;
  currency: Currency;
  customer: string;
  errorMessage: string;
  methodType: string;
  status: PaymentStatus;
}
