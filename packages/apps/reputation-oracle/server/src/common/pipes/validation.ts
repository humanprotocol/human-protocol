import {
  HttpException,
  HttpStatus,
  Injectable,
  ValidationError,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';

@Injectable()
export class HttpValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = this.formatErrorsSnakeCase(errors);
        return new HttpException(
          { validationErrors: messages, message: 'Validation error' },
          HttpStatus.BAD_REQUEST,
        );
      },
      transform: true,
      whitelist: true,
      ...options,
    });
  }

  private formatErrorsSnakeCase(
    errors: ValidationError[],
    parentPath?: string,
  ): string[] {
    const out: string[] = [];
    for (const err of errors) {
      const currentProp = err.property
        ? err.property.replace(/([A-Z])/g, '_$1').toLowerCase()
        : '';
      const path = [parentPath, currentProp].filter(Boolean).join('.');

      if (err.constraints) {
        for (const msg of Object.values(err.constraints)) {
          const adjusted = err.property
            ? msg.replace(new RegExp(`^${err.property}\\s+`, 'i'), '')
            : msg;
          out.push(path ? `${path} ${adjusted}` : adjusted);
        }
      }

      if (err.children && err.children.length) {
        out.push(...this.formatErrorsSnakeCase(err.children, path));
      }
    }
    return out;
  }
}
