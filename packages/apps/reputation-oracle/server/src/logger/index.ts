import { createLogger, NestLogger, LogLevel } from '@human-protocol/logger';

import { SERVICE_NAME } from '@/common/constants';
import Environment from '@/utils/environment';

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
    service: SERVICE_NAME,
    version: Environment.version,
  },
);

export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

export default defaultLogger;
