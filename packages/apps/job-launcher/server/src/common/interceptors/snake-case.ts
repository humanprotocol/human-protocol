import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  transformKeysFromCamelToSnake,
  transformKeysFromSnakeToCamel,
} from '../utils/case-converter';

export const SkipSnakeCaseTransform = Reflector.createDecorator<
  | {
      // Either skip specified top-level body props or skip it entirely
      body?: string[] | boolean;
      query?: boolean;
      response?: boolean;
    }
  | undefined
>({
  key: 'skipSnakeCaseTransform',
});

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const skipTransformOptions = this.reflector.getAllAndOverride(
      SkipSnakeCaseTransform,
      [context.getHandler(), context.getClass()],
    ) || { body: false, query: false, response: false };

    const shouldSkipBody = skipTransformOptions.body === true;
    if (request.body && !shouldSkipBody) {
      const transformed = transformKeysFromSnakeToCamel(request.body);

      const skipBodyProps = Array.isArray(skipTransformOptions.body)
        ? skipTransformOptions.body
        : [];
      for (const prop of skipBodyProps) {
        if (prop in request.body) {
          // @ts-expect-error - 'transformed' is same type as 'request.body'
          transformed[prop] = request.body[prop];
        }
      }

      request.body = transformed;
    }

    const shouldSkipQuery = skipTransformOptions.query === true;
    if (request.query && !shouldSkipQuery) {
      const transformedQuery = transformKeysFromSnakeToCamel(request.query);
      Object.defineProperty(request, 'query', {
        value: transformedQuery,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }

    return next.handle().pipe(
      map((data) => {
        const shouldSkipResponse = skipTransformOptions.query === true;
        if (data instanceof StreamableFile || shouldSkipResponse) {
          return data;
        }

        return transformKeysFromCamelToSnake(data);
      }),
    );
  }
}
