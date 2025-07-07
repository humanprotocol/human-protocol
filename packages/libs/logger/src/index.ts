import { createPinoLogger as createLogger } from './pino-logger';

export { default as NestLogger } from './nest-logger';

export { LogLevel } from './types';
export type { Logger, LoggerFactory, LoggerFactoryOptions } from './types';

export { createLogger };
export default createLogger({ name: 'human-protocol-logger', pretty: true });
