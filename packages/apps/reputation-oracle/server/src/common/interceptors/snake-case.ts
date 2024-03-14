import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CaseConverter } from '../utils/case-converter';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = CaseConverter.transformToCamelCase(request.body);
    }

    if (request.query) {
      request.query = CaseConverter.transformToCamelCase(request.query);
    }

    return next
      .handle()
      .pipe(map((data) => CaseConverter.transformToSnakeCase(data)));
  }
}
