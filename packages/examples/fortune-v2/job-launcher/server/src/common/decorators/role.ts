import { SetMetadata } from "@nestjs/common";

export const Roles = <T>(...roles: Array<T>): ((target: any, key?: any, descriptor?: any) => any) =>
  SetMetadata("roles", [...roles]);
