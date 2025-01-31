import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY_NAME } from '../constants';

@Injectable()
export class JwtAuthGuard
  extends AuthGuard(JWT_STRATEGY_NAME)
  implements CanActivate
{
  constructor(private readonly reflector: Reflector) {
    super();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // `super` has to be called to set `user` on `request`
    // see https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
    return (super.canActivate(context) as Promise<boolean>).catch((e) => {
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    });
  }
}
