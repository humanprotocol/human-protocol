import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserStatus, UserType } from "../enums/user";
import { IBase } from "./base";

export interface IUser extends IBase {
  password: string;
  email: string;
  status: UserStatus;
  type: UserType;
}

export const User = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.user as IUser) || null;
});
