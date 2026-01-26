import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import 'reflect-metadata';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';

@Injectable()
export class TransformEnumInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const query = request.query;

    // Retrieve the class of the controller's DTO (if applicable)
    const targetClass = this.getTargetClass(context);

    if (targetClass) {
      // Transform and validate enums in the body (for POST requests)
      if (body) {
        request.body = this.transformEnums(body, targetClass);
      }

      // Transform and validate enums in the query (for GET requests)
      if (query) {
        const transformedQuery = this.transformEnums(query, targetClass);
        Object.defineProperty(request, 'query', {
          value: transformedQuery,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
    }

    return next.handle().pipe(map((data) => data));
  }

  private getTargetClass(
    context: ExecutionContext,
  ): ClassConstructor<any> | null {
    const handler = context.getHandler();
    const prototype = context.getClass().prototype;

    const paramTypes =
      Reflect.getMetadata(PARAMTYPES_METADATA, prototype, handler.name) ?? [];

    return (
      paramTypes.find((type: unknown) => this.isTransformableClass(type)) ??
      null
    );
  }

  private transformEnums(
    bodyOrQuery: any,
    targetClass: ClassConstructor<any>,
  ): any {
    // Convert the body or query to an instance of the target class
    const transformedInstance = this.lowercaseEnumProperties(
      bodyOrQuery,
      plainToInstance(targetClass, bodyOrQuery),
      targetClass,
    );

    return transformedInstance;
  }

  private lowercaseEnumProperties(
    bodyOrQuery: any,
    instance: any,
    targetClass: ClassConstructor<any>,
  ): any {
    if (!instance || typeof instance !== 'object') {
      return bodyOrQuery;
    }

    for (const property in bodyOrQuery) {
      if (Object.prototype.hasOwnProperty.call(bodyOrQuery, property)) {
        const instanceValue = instance[property];

        // Retrieve enum metadata if available
        const enumType = Reflect.getMetadata(
          'custom:enum',
          targetClass.prototype,
          property,
        );

        if (enumType && typeof instanceValue === 'string') {
          // Check if it's an enum and convert to lowercase
          if (Object.values(enumType).includes(instanceValue.toLowerCase())) {
            bodyOrQuery[property] = instanceValue.toLowerCase();
          }
        } else if (
          typeof bodyOrQuery[property] === 'object' &&
          !Array.isArray(bodyOrQuery[property])
        ) {
          // Recursively handle nested objects
          this.lowercaseEnumProperties(
            bodyOrQuery[property],
            instance[property],
            targetClass,
          );
        }
      }
    }
    return bodyOrQuery;
  }

  private isTransformableClass(type: unknown): type is ClassConstructor<any> {
    if (typeof type !== 'function') {
      return false;
    }

    return (
      type !== String &&
      type !== Boolean &&
      type !== Number &&
      type !== Array &&
      type !== Object
    );
  }
}
