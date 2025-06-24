import type { AxiosError } from 'axios';
import type { ZodError } from 'zod';

export type ResponseError = AxiosError | Error | ZodError | null;

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ResponseError;
  }
}
