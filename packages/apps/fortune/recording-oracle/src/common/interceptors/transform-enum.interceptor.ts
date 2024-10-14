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

    // Retrieve the class of the controller's DTO (if applicable)
    const targetClass = this.getTargetClass(context);

    if (targetClass && body) {
      request.body = this.transformEnums(body, targetClass);
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

  private transformEnums(body: any, targetClass: ClassConstructor<any>): any {
    // Convert the body to an instance of the target class
    let transformedInstance = plainToInstance(targetClass, body);

    // Transform the enums before validation
    transformedInstance = this.lowercaseEnumProperties(
      body,
      transformedInstance,
      targetClass,
    );

    // Validate the transformed body
    const validationErrors = validateSync(transformedInstance);
    if (validationErrors.length > 0) {
      throw new BadRequestException('Validation failed');
    }

    return body;
  }

  private lowercaseEnumProperties(
    body: any,
    instance: any,
    targetClass: ClassConstructor<any>,
  ): any {
    for (const property in body) {
      if (Object.prototype.hasOwnProperty.call(body, property)) {
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
            body[property] = instanceValue.toLowerCase();
          }
        } else if (
          typeof body[property] === 'object' &&
          !Array.isArray(body[property])
        ) {
          // Recursively handle nested objects
          this.lowercaseEnumProperties(
            body[property],
            instance[property],
            targetClass,
          );
        }
      }
    }
    return body;
  }
}
