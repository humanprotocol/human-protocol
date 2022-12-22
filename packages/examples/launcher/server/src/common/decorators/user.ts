import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IBase } from "./base";

export interface IUser extends IBase {
  email: string;
  status: UserStatus;
  type: UserType;
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}

export enum UserType {
  OPERATOR = "OPERATOR",
  REQUESTER = "REQUESTER",
}

export const User = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.user as IUser) || null;
});
