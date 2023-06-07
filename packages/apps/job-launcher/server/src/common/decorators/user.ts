import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserStatus, UserType } from '../enums/user';
import { IBase } from './base';

export interface IUser extends IBase {
  password: string;
  email: string;
  status: UserStatus;
  type: UserType;
}

/**
 * Custom decorator to retrieve the currently logged-in user.
 * Returns the user object from the request context.
 */
export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (request.user as IUser) || null;
  },
);
