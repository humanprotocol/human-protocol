import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/user';

/**
 * Decorator for HTTP endpoints to bypass JWT auth guard
 * where JWT auth not needed
 */
export const Public = Reflector.createDecorator<boolean>({
  key: 'isPublic',
  transform: () => true,
});

/**
 * Decorator to specify the list of roles accepted by RolesAuthGuard
 */
export const Roles = Reflector.createDecorator<UserRole[]>({
  key: 'roles',
});
