// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseErrorMessage = (error: any) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error.response) {
    return error.response?.data?.message ?? 'Something went wrong.';
  }
  return error.message ?? 'Something went wrong.';
};
