import { AxiosError } from 'axios';
import { ZodError } from 'zod';

const handleErrorMessage = (unknownError: unknown): string => {
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
};

export default handleErrorMessage;
