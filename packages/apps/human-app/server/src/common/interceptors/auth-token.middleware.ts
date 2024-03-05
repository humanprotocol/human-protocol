import { RequestContext } from '../utils/request-context.util';
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContext) {}

  use(req: any, res: any, next: () => void) {
    const authorization = req.headers['authorization'];
    this.requestContext.token = authorization;
    next();
  }
}
