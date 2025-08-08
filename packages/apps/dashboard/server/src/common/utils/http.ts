import { AxiosError } from 'axios';

export function formatAxiosError(error: AxiosError) {
  return {
    name: error.name,
    stack: error.stack,
    cause: error.cause,
    message: error.message,
  };
}
