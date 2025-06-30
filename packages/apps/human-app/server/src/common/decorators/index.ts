import { Reflector } from '@nestjs/core';

export * from './enums';

/**
 * Decorator for HTTP endpoints to bypass JWT auth guard
 * where JWT auth not needed
 */
export const Public = Reflector.createDecorator<boolean>({
  key: 'isPublic',
  transform: () => true,
});
