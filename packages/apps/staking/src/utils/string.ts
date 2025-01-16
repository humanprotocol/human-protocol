// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseErrorMessage = (error: any) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error.response) {
    return error.response?.data?.message ?? 'Something went wrong.';
  }

  if (error.message) {
    const match = error.message.match(/Contract execution error: (.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }

    return error.message;
  }

  return 'Something went wrong.';
};
