export class BaseError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = this.constructor.name;
    if (stack) {
      this.stack = stack;
    }
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}

export class AuthError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}

export class ServerError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}
