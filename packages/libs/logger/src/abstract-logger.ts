import { ERROR_KEY, MESSAGE_KEY, TIMESTAMP_KEY } from './constants';
import { ChildBindings, Logger, LogLevel, LogMeta, LogRecord } from './types';

function isPlainObject(maybeObj: unknown): maybeObj is LogMeta {
  return Object.prototype.toString.call(maybeObj) === '[object Object]';
}

function isValidLoggerName(maybeName: unknown): maybeName is string {
  return typeof maybeName === 'string' && maybeName.length > 0;
}

type ErrorLike = {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
};
function serializeError(error: ErrorLike) {
  let errorKind: string;
  if (
    Object.prototype.toString.call(error.constructor) === '[object Function]' &&
    error.name === 'Error'
  ) {
    /**
     * Some errors (e.g. https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
     * might have with weird constructor name and `name` implying `code` (error id) there,
     * and `name` prop should be used instead of constructor name then.
     *
     * So here we handle only custom errors that extend Error class, but do not have
     * `this.name = this.constructor.name` set. In any other case `error.name` should be sufficient.
     */
    errorKind = error.constructor.name;
  } else {
    errorKind = error.name;
  }

  if (Reflect.has(error, 'toJSON')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = (error as any).toJSON();

    delete serialized.name;
    serialized.kind = errorKind;

    return serialized;
  } else {
    const { message, stack, ...errorProps } = error;
    return {
      kind: errorKind,
      message,
      stack,
      ...errorProps,
    };
  }
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

  debug(message: string, errorOrMeta?: unknown): void {
    this.log(LogLevel.DEBUG, message, errorOrMeta);
  }

  info(message: string, errorOrMeta?: unknown): void {
    this.log(LogLevel.INFO, message, errorOrMeta);
  }

  warn(message: string, errorOrMeta?: unknown): void {
    this.log(LogLevel.WARN, message, errorOrMeta);
  }

  error(message: string, errorOrMeta?: unknown): void {
    this.log(LogLevel.ERROR, message, errorOrMeta);
  }

  child(bindings: ChildBindings): Logger {
    if (!isPlainObject(bindings)) {
      throw new Error('Log bindings required for child logger');
    }

    return this.createChild(bindings);
  }

  protected abstract createChild(bindings: LogMeta): Logger;

  private log(level: LogLevel, message: string, errorOrMeta?: unknown): void {
    const logMessage = typeof message === 'string' ? message : `${message}`;

    let metaArgument: LogMeta;
    if (errorOrMeta === undefined) {
      metaArgument = {};
    } else if (errorOrMeta instanceof Error) {
      metaArgument = {
        [ERROR_KEY]: serializeError(errorOrMeta),
      };
    } else if (isPlainObject(errorOrMeta)) {
      metaArgument = Object.assign({}, errorOrMeta);

      const error = metaArgument[ERROR_KEY];
      if (error instanceof Error) {
        metaArgument[ERROR_KEY] = serializeError(error);
      } else if (error !== undefined) {
        metaArgument[ERROR_KEY] = error;
      }
    } else {
      /**
       * Fallback in case somebody uses log in a wrong way
       */
      metaArgument = {
        meta: errorOrMeta,
      };
    }

    const enrichedMeta: LogRecord = {
      ...this.bindings,
      ...metaArgument,
      level,
      [MESSAGE_KEY]: logMessage,
      [TIMESTAMP_KEY]: Date.now(),
    };

    if (this.name) {
      enrichedMeta.logger = this.name;
    }

    this.callLogger(level, enrichedMeta);
  }

  protected abstract callLogger(level: LogLevel, log: LogRecord): void;
}

export default LoggerWrapper;
