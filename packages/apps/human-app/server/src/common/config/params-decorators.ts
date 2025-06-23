import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';
import { JwtUserData } from '../utils/jwt-token.model';
import Logger from '@human-protocol/logger';

const logger = Logger.child({
  context: 'JwtPayloadDecorator',
});

export const Authorization = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    if (token) {
      return token;
    }
    throw new UnauthorizedException();
  },
);

export const JwtPayload = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const decoded = jwtDecode(token);
      return decoded as JwtUserData;
    } catch (error) {
      logger.error(`Error in decoding token: ${token}`, error);
      throw new BadRequestException();
    }
  },
);
