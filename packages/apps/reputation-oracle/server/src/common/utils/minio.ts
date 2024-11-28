import { MinioErrorCodes } from '../enums/minio';

export function isNotFoundError(error: any): boolean {
  return error?.code === MinioErrorCodes.NotFound;
}
