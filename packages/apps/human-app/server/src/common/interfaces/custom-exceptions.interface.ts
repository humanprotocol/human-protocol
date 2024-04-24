export class EnvironmentVariableMissingError extends Error {
  constructor(variable: string) {
    super(`Environment variable(s): {${variable}} not defined.`);
    Object.setPrototypeOf(this, EnvironmentVariableMissingError.prototype);
  }
}
