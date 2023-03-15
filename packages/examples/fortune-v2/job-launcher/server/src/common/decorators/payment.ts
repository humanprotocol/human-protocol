import { IBase } from "./base";

export interface IPayment extends IBase {
  paymentId: string;
  amount: number;
  clientSecret: string;
  currency: Currency;
  customer: string;
  errorMessage: string;
  method: string;
  status: PaymentStatus;
}

export enum Currency {
  USD = "USD",
}

export enum Crypto {
  HMT = "HMT",
}

export enum MethodType {
  CARD = "CARD",
}

export enum PaymentStatus {
  CANCELED = "CANCELED",
  PROCESSING = "PROCESSING",
  REQUIRES_ACTION = "REQUIRES_ACTION",
  REQUIRES_CAPTURE = "REQUIRES_CAPTURE",
  REQUIRES_CONFIRMATION = "REQUIRES_CONFIRMATION",
  REQUIRES_PAYMENT_METHOD = "REQUIRES_PAYMENT_METHOD",
  SUCCEEDED = "SUCCEEDED",
}