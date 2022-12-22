import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IBase } from "./base";

export interface ITransaction extends IBase {
  amount: number;
  hash: string;
  confirmations: number;
  type: TransactionType;
  status: TransactionStatus;
}

export enum TransactionStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
}

export enum TransactionType {
  TOPUP = "TOPUP",
  ESCROW_CREATE = "ESCROW_CREATE",
  ESCROW_SETUP = "ESCROW_SETUP",
}

export const CONFIRMATION_TRESHOLD = 1;

export const Transaction = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.transaction as ITransaction) || null;
});
