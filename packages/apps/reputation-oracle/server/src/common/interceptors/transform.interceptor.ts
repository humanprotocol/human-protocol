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

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = this.transformRequestData(request.body);
    }

    if (request.query) {
      request.query = this.transformRequestData(request.query);
    }

    return next.handle().pipe(map((data) => this.transformResponseData(data)));
  }

  private transformRequestData(input: unknown): unknown {
    return CaseConverter.transformKeysFromSnakeToCamel(input);
  }

  private transformResponseData(input: unknown): unknown {
    if (input instanceof StreamableFile) {
      return input;
    }

    return CaseConverter.transformKeysFromCamelToSnake(input);
  }
}
