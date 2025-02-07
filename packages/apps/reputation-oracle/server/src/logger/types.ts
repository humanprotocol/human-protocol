export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export type LogMeta = Record<string, unknown>;

export type LogRecord = {
  logger?: string;
  level: `${LogLevel}`;
  message: string;
  timestamp: number;
} & LogMeta;

type LogFn = {
  (message: string, meta?: LogMeta): void;
  (message: string, error: Error): void;
  (message: string, errorOrMeta?: LogMeta | Error): void;
};

export type ChildBindings = { name?: string } & LogMeta;

export interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  child: (bindings: ChildBindings) => Logger;
}

export type LoggerOptions = {
  name?: string;
  pretty?: boolean;
  level?: `${LogLevel}`;
  disabled?: boolean;
};
