import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';
import { JwtUserData } from '../utils/jwt-token.model';

const logger = new Logger('JwtPayloadDecorator');

export const Authorization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    if (token) {
      return token;
    }
    throw new UnauthorizedException();
  },
);

export const JwtPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
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
