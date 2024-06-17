import type { ZodError } from 'zod';
import type { JsonRpcError } from 'ethers';
import type { FetchError } from '@/api/fetcher';

export interface Children {
  children?: React.ReactNode;
}

export type ResponseError = FetchError | Error | ZodError | JsonRpcError | null;

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ResponseError;
  }
}

export type FormNotifications = 'warning' | 'error' | 'default';
