import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = this.transformToCamelCase(request.body);
    }

    if (request.query) {
      request.query = this.transformToCamelCase(request.query);
    }

    return next.handle().pipe(map((data) => this.transformToSnakeCase(data)));
  }

  private transformToCamelCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelCaseKey = key.replace(/_([a-z])/g, (g) =>
          g[1].toUpperCase(),
        );
        result[camelCaseKey] = obj[key];
      }
    }
    return result;
  }

  private transformToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformToSnakeCase(item));
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).reduce(
        (acc: Record<string, any>, key: string) => {
          const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          acc[snakeCaseKey] = this.transformToSnakeCase(obj[key]);
          return acc;
        },
        {},
      );
    } else {
      return obj;
    }
  }
}
