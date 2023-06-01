import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IBase } from "./base";

export interface IWebhook extends IBase {
  signature: string;
  chainId: number;
  escrowAddress: string;
  retriesCount?: number;
  status?: WebhookStatus;
  waitUntil?: Date;
}

export enum ChainId {
  GOERLI = 5,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBASE_ALPHA = 1287,
  LOCALHOST = 1338,
}

export enum WebhookStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PAID = "PAID"
}

export const Webhook = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.job as IWebhook) || null;
});
