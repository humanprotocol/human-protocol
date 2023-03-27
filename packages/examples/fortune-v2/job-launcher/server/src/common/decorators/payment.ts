import { IBase } from "../decorators/base";
import { Currency, PaymentType } from "../enums/currencies";

export interface IPayment extends IBase {
  paymentId?: string;
  clientSecret?: string;
  amount: number;
  currency: Currency;
  type: PaymentType;
}
