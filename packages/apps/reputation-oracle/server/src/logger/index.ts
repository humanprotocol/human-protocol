import { createLogger } from './pino-logger';
import NestLogger from './nest-logger';
import { LogLevel } from './types';

const environment = process.env.NODE_ENV || 'local';
const isDevEnvironment = ['development', 'local'].includes(environment);

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: isDevEnvironment ? LogLevel.DEBUG : LogLevel.INFO,
    pretty: isDevEnvironment,
    disabled: environment === 'test',
  },
  {
    environment,
    service: 'reputation-oracle',
  },
);

export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

export default defaultLogger;
