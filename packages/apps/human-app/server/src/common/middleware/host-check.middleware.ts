import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EnvironmentConfigService } from '../config/environment-config.service';

@Injectable()
export class ForbidUnauthorizedHostMiddleware implements NestMiddleware {
  constructor(private readonly envConfigService: EnvironmentConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const allowedHost = this.envConfigService.allowedHost;
    const requestHost = req.get('host');
    
    if (requestHost !== allowedHost) {
      throw new ForbiddenException('Forbidden host');
    }

    next();
  }
}
