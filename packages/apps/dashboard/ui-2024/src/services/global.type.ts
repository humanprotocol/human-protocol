import type { ZodError } from 'zod';
import type { AxiosError } from 'axios';

export type ResponseError = AxiosError | Error | ZodError | null;

declare module '@tanstack/react-query' {
	interface Register {
		defaultError: ResponseError;
	}
}
