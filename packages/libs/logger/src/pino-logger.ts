import pino from 'pino';

import LoggerWrapper from './abstract-logger';
import {
  ChildBindings,
  LogMeta,
  Logger,
  LogLevel,
  LoggerFactory,
  LogRecord,
} from './types';

export class WrappedPino extends LoggerWrapper {
  constructor(
    private readonly pinoLogger: pino.Logger,
    bindings?: LogMeta,
  ) {
    super(bindings);
  }

  protected createChild(bindings: ChildBindings): Logger {
    return new WrappedPino(this.pinoLogger, {
      ...this.bindings,
      ...bindings,
    });
  }

  protected callLogger(level: LogLevel, log: LogRecord): void {
    const _log: Partial<LogRecord> = { ...log };

    delete _log.level;

    this.pinoLogger[level](_log);
  }
}

const pinoLogLevelFormatter = (label: string) => ({ level: label });

export const createPinoLogger: LoggerFactory = (
  { name, level, pretty, disabled },
  bindings: LogMeta = {},
) => {
  const pinoLogger = pino({
    base: null,
    level: level || LogLevel.DEBUG,
    enabled: disabled !== true,
    timestamp: false,
    formatters: {
      level: pinoLogLevelFormatter,
    },
    transport: pretty
      ? {
          target: 'pino-pretty',
          options: {
            messageKey: 'message',
            translateTime: "SYS:yyyy-mm-dd, HH:MM:ss'Z'",
            colorize: true,
          },
        }
      : undefined,
  });

  return new WrappedPino(pinoLogger, { ...bindings, name });
};
