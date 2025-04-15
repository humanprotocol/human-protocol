import type { ZodError } from 'zod';
import type { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';
import { type ApiClientError } from '@/api';

export interface Children {
  children?: React.ReactNode;
}

export type ResponseError = ApiClientError | Error | ZodError | JsonRpcError;

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ResponseError;
  }
}

export type FormNotifications = 'warning' | 'error' | 'default';
