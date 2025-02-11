import { Environment } from '../constants';

export function isDevelopmentEnv(): boolean {
  return (
    process.env.NODE_ENV === Environment.DEVELOPMENT ||
    process.env.NODE_ENV === Environment.TEST
  );
}
