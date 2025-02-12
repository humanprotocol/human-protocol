import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as CaseConverter from '../../utils/case-converters';
import { isObject } from '../../utils/type-guards';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = TransformInterceptor.transformRequestData(request.body);
    }

    if (request.query) {
      request.query = TransformInterceptor.transformRequestData(request.query);
    }

    return next
      .handle()
      .pipe(map((data) => TransformInterceptor.transformResponseData(data)));
  }

  static transformRequestData(input: unknown): unknown {
    /**
     * If primitive value - no need to transform
     */
    if (!isObject(input)) {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(TransformInterceptor.transformRequestData);
    }

    const transformedObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      transformedObject[CaseConverter.snakeToCamel(key)] =
        TransformInterceptor.transformRequestData(value);
    }
    return transformedObject;
  }

  static transformResponseData(input: unknown): unknown {
    /**
     * If primitive value or file - return as is
     */
    if (!isObject(input) || input instanceof StreamableFile) {
      return input;
    }

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (Array.isArray(input)) {
      return input.map(TransformInterceptor.transformResponseData);
    }

    const transformedObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      transformedObject[CaseConverter.camelToSnake(key)] =
        TransformInterceptor.transformResponseData(value);
    }
    return transformedObject;
  }
}
