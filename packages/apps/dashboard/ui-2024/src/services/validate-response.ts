import { ZodError, type z } from 'zod';

type ValidReturn<T> = { data: T; errors: null; originalError: null };
type InvalidReturn = { data: null; errors: string[]; originalError: unknown };

export const validateObject = <T>(
	object: unknown,
	zodObject: z.ZodSchema<T>
): ValidReturn<T> | InvalidReturn => {
	try {
		const data = zodObject.parse(object);

		return { data, errors: null, originalError: null };
	} catch (error) {
		if (error instanceof ZodError) {
			return {
				data: null,
				errors: error.errors.map(({ message, path }) => {
					const errorPath = path.join('.');
					return `${errorPath}: ${message}`;
				}),
				originalError: error,
			};
		}

		if (error instanceof Error) {
			return { data: null, errors: [error.message], originalError: error };
		}

		return {
			data: null,
			errors: ['Something went wrong'],
			originalError: error,
		};
	}
};
