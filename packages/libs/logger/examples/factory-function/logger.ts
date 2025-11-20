import { createLogger, isLogLevel, LogLevel } from '../../src';

const ENV_NAME = process.env.NODE_ENV || 'development';
const isDevelopment = ENV_NAME === 'development';
const isTest = process.env.NODE_ENV === 'test';

const LOG_LEVEL_OVERRIDE = process.env.LOG_LEVEL;

let logLevel = LogLevel.INFO;
if (isLogLevel(LOG_LEVEL_OVERRIDE)) {
  logLevel = LOG_LEVEL_OVERRIDE;
} else if (isDevelopment) {
  logLevel = LogLevel.DEBUG;
}

const defaultExampleLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: logLevel,
    pretty: isDevelopment || process.env.LOG_PRETTY === 'true',
    disabled: isTest,
  },
  {
    environment: ENV_NAME,
    service: 'logger-examples',
    version: 'ff-ex-v1',
  },
);

export default defaultExampleLogger;
