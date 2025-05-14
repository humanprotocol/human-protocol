import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/user';

/**
 * Decorator for HTTP endpoints to bypass JWT auth guard
 * checks for endpoints that do not need JWT auth.
 */
export const Public = Reflector.createDecorator<boolean>({
  key: 'isPublic',
  transform: () => true,
});

export const Roles = Reflector.createDecorator<UserRole[]>({
  key: 'roles',
});
