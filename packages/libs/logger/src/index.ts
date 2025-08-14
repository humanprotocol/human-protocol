import { createPinoLogger } from './pino-logger';
import { isLogLevel, LoggerFactory, LogLevel } from './types';

const FALLBACK_LEVEL = LogLevel.INFO;

const createLogger: LoggerFactory = (options, bindings) => {
  if (options.level) {
    if (!isLogLevel(options.level)) {
      console.warn(
        `Unknown log level '${options.level}'. Fallback to '${FALLBACK_LEVEL}'`,
      );
      options.level = FALLBACK_LEVEL;
    }
  } else {
    options.level = LogLevel.DEBUG;
  }

  return createPinoLogger(options, bindings);
};

export { LogLevel, isLogLevel } from './types';
export type { Logger, LoggerFactory, LoggerFactoryOptions } from './types';

export { default as NestLogger } from './nest-logger';
export { createLogger };

export default createLogger({ name: 'human-protocol-logger', pretty: true });
