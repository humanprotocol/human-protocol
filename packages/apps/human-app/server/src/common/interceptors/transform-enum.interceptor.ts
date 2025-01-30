import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';
import 'reflect-metadata';

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
        request.query = this.transformEnums(query, targetClass);
      }
    }

    return next.handle().pipe(map((data) => data));
  }

  private getTargetClass(
    context: ExecutionContext,
  ): ClassConstructor<any> | null {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get the parameter types of the route handler
    const routeArgs = Reflect.getMetadata(
      'design:paramtypes',
      controller.prototype,
      handler.name,
    );

    // Return the first parameter's constructor if the handler has a class (DTO)
    return routeArgs && routeArgs.length > 0
      ? (routeArgs[0] as ClassConstructor<any>)
      : null;
  }

  private transformEnums(
    bodyOrQuery: any,
    targetClass: ClassConstructor<any>,
  ): any {
    // Convert the body or query to an instance of the target class
    let transformedInstance = plainToInstance(targetClass, bodyOrQuery);

    // Transform the enums before validation
    transformedInstance = this.lowercaseEnumProperties(
      bodyOrQuery,
      transformedInstance,
      targetClass,
    );

    // Validate the transformed data
    const validationErrors = validateSync(transformedInstance);
    if (validationErrors.length > 0) {
      throw new BadRequestException('Validation failed');
    }

    return bodyOrQuery;
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
      if (bodyOrQuery.hasOwnProperty(property)) {
        const instanceValue = instance[property];

        // Retrieve enum metadata if available
        const enumType = Reflect.getMetadata(
          'custom:enum',
          targetClass.prototype,
          property,
        );

        if (!enumType) {
          continue; // Skip this property if no enum metadata is found
        }

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
}
