import {
  createLogger,
  NestLogger,
  LogLevel,
  isLogLevel,
} from '@human-protocol/logger';

import { SERVICE_NAME } from '@/common/constants';
import Environment from '@/utils/environment';

const isDevelopment = Environment.isDevelopment();

const LOG_LEVEL_OVERRIDE = process.env.LOG_LEVEL;

let logLevel = LogLevel.INFO;
if (isLogLevel(LOG_LEVEL_OVERRIDE)) {
  logLevel = LOG_LEVEL_OVERRIDE;
} else if (isDevelopment) {
  logLevel = LogLevel.DEBUG;
}

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: logLevel,
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
