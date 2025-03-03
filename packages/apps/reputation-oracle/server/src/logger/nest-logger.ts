import { LoggerService } from '@nestjs/common';
import { Logger, LogLevel, LogMeta } from './types';

class NestLogger implements LoggerService {
  constructor(private readonly loggerInstance: Logger) {}

  log(message: any, ...optionalParams: any[]) {
    this.callLogger(LogLevel.INFO, message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.callLogger(LogLevel.WARN, message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    let _message: any;
    let _optionalParams: any[];

    const firstParam = optionalParams[0] || '';
    if (
      typeof message === 'string' &&
      typeof firstParam === 'string' &&
      /\n\s+at\s.+:\d+:\d+/.test(firstParam)
    ) {
      /**
       * It's a case when logger called as
       * logger.error(error.message, error.stack)
       */
      const error = new Error(message);
      error.stack = firstParam;

      _message = error;
      _optionalParams = optionalParams.slice(1);
    } else {
      _message = message;
      if (optionalParams.length === 2 && optionalParams[0] === undefined) {
        /**
         * It's a case when logger called as
         * logger.error(message)
         *
         * In this case Nest adds `undefined` "stack"
         * as second param
         */
        _optionalParams = [optionalParams[1]];
      } else {
        _optionalParams = optionalParams;
      }
    }

    this.callLogger(LogLevel.ERROR, _message, ..._optionalParams);
  }

  private callLogger(
    level: LogLevel,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    const logMeta: LogMeta = {};

    let params: unknown[] = [];
    // Nest always add "context" as last param
    if (optionalParams.length) {
      const lastParam = optionalParams.at(-1);
      if (typeof lastParam === 'string') {
        logMeta.context = lastParam;
        params = optionalParams.slice(0, -1);
      } else {
        params = optionalParams;
      }
    }

    // Case when Nest logs something other than context
    if (params.length) {
      logMeta.messages = params;
    }

    let _message = `unspecified nest ${level}`.toUpperCase();
    // Case when Nest logs just one argument: object
    if (typeof message === 'object') {
      if (message instanceof Error) {
        logMeta.error = message;
      } else {
        Object.assign(logMeta, message);
      }
    } else if (message !== undefined) {
      _message = message.toString();
    }

    this.loggerInstance[level](_message, logMeta);
  }
}

export default NestLogger;
