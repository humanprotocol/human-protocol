import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
  CallHandler,
} from '@nestjs/common';

@Injectable()
export class NotFoundInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        if (data === void 0 || data === null) {
          throw new NotFoundException();
        }
      }),
    );
  }
}
