import { createLogger } from './pino-logger';
import NestLogger from './nest-logger';
import { LogLevel } from './types';

// Environment detection similar to reputation oracle
enum EnvironmentName {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

class Environment {
  static readonly envName: string =
    process.env.NODE_ENV || EnvironmentName.DEVELOPMENT;

  static isDevelopment(): boolean {
    return [
      EnvironmentName.DEVELOPMENT,
      EnvironmentName.TEST,
      EnvironmentName.LOCAL,
    ].includes(Environment.envName as EnvironmentName);
  }

  static isTest(): boolean {
    return Environment.envName === EnvironmentName.TEST;
  }
}

// Create default logger instance
const isDevelopment = Environment.isDevelopment();

const defaultLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    pretty: isDevelopment,
    disabled: Environment.isTest(),
  },
  {
    environment: Environment.envName,
    service: 'human-protocol',
  },
);

// Create NestJS logger override
export const nestLoggerOverride = new NestLogger(
  defaultLogger.child({ name: 'NestLogger' }),
);

// Export the default logger as the main export
export default defaultLogger;
