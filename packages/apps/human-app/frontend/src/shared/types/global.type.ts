import type { ZodError } from 'zod';
import type { FetchError } from '@/api/fetcher';
import type { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';

export interface Children {
  children?: React.ReactNode;
}

export type ResponseError = FetchError | Error | ZodError | JsonRpcError;

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ResponseError;
  }
}

export type FormNotifications = 'warning' | 'error' | 'default';
