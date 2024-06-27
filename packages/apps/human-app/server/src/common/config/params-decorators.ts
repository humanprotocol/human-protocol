import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';
import { JwtUserData } from '../utils/jwt-token.model';

export const Authorization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['authorization'];
  },
);
export const JwtPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded as JwtUserData;
    } catch (error) {
      console.error('Error in decoding token: ', error);
      return null;
    }
  },
);
