import { ISignature } from "../../common/interfaces/signature";

export interface IWebhookIncomingCreateDto {
  signature: string;
}

export interface IWebhookOutgoingCreateDto {
  signature: string;
  payload: ISignature;
}

