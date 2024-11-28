export class BaseError extends Error {
  constructor(message: string, cause?: unknown) {
    const errorOptions: ErrorOptions = {};
    if (cause) {
      errorOptions.cause = cause;
    }

    super(message, errorOptions);
    this.name = this.constructor.name;
  }
}
