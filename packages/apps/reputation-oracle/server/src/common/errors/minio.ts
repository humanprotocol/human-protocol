enum MinioErrorCodes {
  NotFound = 'NotFound',
}

export function isNotFoundError(error: any): boolean {
  return error?.code === MinioErrorCodes.NotFound;
}
