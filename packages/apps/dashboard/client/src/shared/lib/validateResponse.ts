import { ZodError, type z } from 'zod';

const validateResponse = <T extends z.ZodTypeAny>(
  object: unknown,
  zodObject: T
): z.infer<T> => {
  try {
    const data = zodObject.parse(object);

    return data;
  } catch (error) {
    console.error('Unexpected response');
    if (error instanceof ZodError) {
      error.issues.forEach((issue) => {
        console.error(issue);
      });
    }
    console.error(error);
    throw error;
  }
};

export default validateResponse;
