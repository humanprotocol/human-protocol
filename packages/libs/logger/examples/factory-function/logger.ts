import { createLogger, LogLevel } from '../../src';

const ENV_NAME = process.env.NODE_ENV || 'development';
const isDevelopment = ENV_NAME === 'development';
const isTest = process.env.NODE_ENV === 'test';

const defaultExampleLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    pretty: isDevelopment,
    disabled: isTest,
  },
  {
    environment: ENV_NAME,
    service: 'logger-examples',
  },
);

export default defaultExampleLogger;
