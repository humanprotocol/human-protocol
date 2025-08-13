import { createLogger, NestLogger, LogLevel } from '@human-protocol/logger';

import Environment from '../common/utils/environment';

const isDevelopment = Environment.isDevelopment();

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    pretty: isDevelopment,
    disabled: Environment.isTest(),
  },
  {
    environment: Environment.name,
    service: 'human-app',
    version: Environment.version,
  },
);

export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

export default defaultLogger;
