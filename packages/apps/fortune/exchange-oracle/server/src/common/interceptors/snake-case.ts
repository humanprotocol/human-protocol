import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  transformKeysFromCamelToSnake,
  transformKeysFromSnakeToCamel,
} from '../utils/case-converter';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = transformKeysFromSnakeToCamel(request.body);
    }

    if (request.query) {
      request.query = transformKeysFromSnakeToCamel(request.query);
    }

    return next
      .handle()
      .pipe(map((data) => transformKeysFromCamelToSnake(data)));
  }
}
