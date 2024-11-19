export const parseErrorMessage = (error: any) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error.response) {
    return error.response?.data?.message ?? 'Something went wrong.';
  }
  return error.message ?? 'Something went wrong.';
};

export const getFilenameFromContentDisposition = (
  headerValue: string,
): string | null => {
  const match = /filename="(.+)"/.exec(headerValue);
  if (!match) {
    return null;
  }

  return match[1];
};
