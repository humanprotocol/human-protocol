import { type z } from 'zod';

export const validateResponse = <T>(
	object: unknown,
	zodObject: z.ZodSchema<T>
): T => {
	try {
		const data = zodObject.parse(object);

		return data;
	} catch (error) {
		console.error('Unexpected response');
		console.error(error);
		throw error;
	}
};
