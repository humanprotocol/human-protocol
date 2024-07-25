import { AxiosError } from 'axios';
import { ZodError } from 'zod';

export function handleErrorMessage(unknownError: unknown): string {
	if (unknownError instanceof AxiosError) {
		return unknownError.message;
	}

	if (unknownError instanceof ZodError) {
		return 'Unexpected data error';
	}

	if (unknownError instanceof Error) {
		return unknownError.message;
	}

	return 'Something went wrong';
}
