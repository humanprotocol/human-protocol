import { ChildBindings, Logger, LogLevel, LogMeta, LogRecord } from './types';

function isPlainObject(maybeObj: unknown): boolean {
  return Object.prototype.toString.call(maybeObj) === '[object Object]';
}

function isValidLoggerName(maybeName: unknown): maybeName is string {
  return typeof maybeName === 'string' && maybeName.length > 0;
}

function serializeError(error: Error) {
  const { name, message, stack, ...errorProps } = error;

  return {
    kind: name,
    message,
    stack,
    ...errorProps,
  };
}

abstract class LoggerWrapper implements Logger {
  protected readonly bindings: LogMeta;
  private readonly name?: string;

  constructor(bindings: LogMeta = {}) {
    if (!isPlainObject(bindings)) {
      throw new Error('Logger bindings must be a plain object');
    }

    const { name, ..._bindings } = bindings;

    this.bindings = _bindings;

    if (name && isValidLoggerName(name)) {
      this.name = name;
    }
  }

  debug(message: string, errorOrMeta?: Error | LogMeta): void {
    this.log(LogLevel.DEBUG, message, errorOrMeta);
  }

  info(message: string, errorOrMeta?: Error | LogMeta): void {
    this.log(LogLevel.INFO, message, errorOrMeta);
  }

  warn(message: string, errorOrMeta?: Error | LogMeta): void {
    this.log(LogLevel.WARN, message, errorOrMeta);
  }

  error(message: string, errorOrMeta?: Error | LogMeta): void {
    this.log(LogLevel.ERROR, message, errorOrMeta);
  }

  child(bindings: ChildBindings): Logger {
    if (!isPlainObject(bindings)) {
      throw new Error('Log bindings required for child logger');
    }

    return this.createChild(bindings);
  }

  protected abstract createChild(bindings: LogMeta): Logger;

  private log(
    level: LogLevel,
    message: string,
    errorOrMeta?: Error | LogMeta,
  ): void {
    if (typeof message !== 'string') {
      throw new Error('Log message must be a string');
    }

    let metaArgument: LogMeta;
    if (errorOrMeta === undefined) {
      metaArgument = {};
    } else if (errorOrMeta instanceof Error) {
      metaArgument = {
        error: serializeError(errorOrMeta),
      };
    } else if (isPlainObject(errorOrMeta)) {
      const { error, ...meta } = errorOrMeta;
      metaArgument = meta;
      if (error instanceof Error) {
        Object.assign(metaArgument, {
          error: serializeError(error),
        });
      } else {
        metaArgument.error = error;
      }
    } else {
      throw new Error('Log meta should be either error or plain object');
    }

    const enrichedMeta: LogRecord = {
      ...this.bindings,
      ...metaArgument,
      level,
      message,
      timestamp: Date.now(),
    };

    if (this.name) {
      enrichedMeta.logger = this.name;
    }

    this.callLogger(level, enrichedMeta);
  }

  protected abstract callLogger(level: LogLevel, log: LogRecord): void;
}

export default LoggerWrapper;
