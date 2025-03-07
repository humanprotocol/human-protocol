import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/user';

export const Public = Reflector.createDecorator<boolean>({
  key: 'isPublic',
  transform: () => true,
});

export const Roles = Reflector.createDecorator<UserRole[]>({
  key: 'roles',
});
