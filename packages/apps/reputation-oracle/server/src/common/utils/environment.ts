import { Environment } from '../constants';

export function isDevelopmentEnv(): boolean {
  return [Environment.DEVELOPMENT, Environment.TEST].includes(
    process.env.NODE_ENV as Environment,
  );
}
