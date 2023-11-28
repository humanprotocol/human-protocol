import { SetMetadata } from '@nestjs/common';

export const ApiKey = (): ((target: any, key?: any, descriptor?: any) => any) =>
  SetMetadata('isApiKey', true);
