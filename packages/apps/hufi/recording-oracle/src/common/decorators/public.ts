import { SetMetadata } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Public = (): ((target: any, key?: any, descriptor?: any) => any) =>
  SetMetadata('isPublic', true);
