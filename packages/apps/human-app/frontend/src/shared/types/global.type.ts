import type { ZodError } from 'zod';
import type { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';
import { type ApiClientError } from '@/api';

export type ResponseError = ApiClientError | Error | ZodError | JsonRpcError;

declare global {
  interface Window {
    $zoho?: {
      salesiq?: {
        chat?: {
          start?: () => void;
        };
        floatbutton?: {
          visible?: (state: 'show' | 'hide' | number) => void;
        };
      };
    };
  }
}

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ResponseError;
  }
}
