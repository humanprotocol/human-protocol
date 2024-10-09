import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class EnumTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    this.transformEnums(request.body);

    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }

  private transformEnums(obj: any) {
    if (typeof obj !== 'object' || obj === null) return obj;

    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].toLowerCase();
      } else if (typeof obj[key] === 'object') {
        this.transformEnums(obj[key]);
      }
    }
  }
}
