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
  CARD = "card",
}

export enum PaymentStatus {
  FAILED = "FAILED",
  SUCCEEDED = "SUCCEEDED",
}