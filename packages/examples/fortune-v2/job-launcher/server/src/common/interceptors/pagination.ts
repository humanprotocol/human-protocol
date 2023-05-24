import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(([rows, count]) => ({ rows, count })));
  }
}
