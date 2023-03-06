import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserType } from "../decorators";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const types = this.reflector.getAllAndOverride<UserType[]>("roles", [context.getHandler(), context.getClass()]);

    if (!types || !types.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      return false;
    }

    return types.includes(request.user.type);
  }
}
