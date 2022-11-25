import winston from 'winston';

/**
 * Winston logger instance
 */
export const createLogger = (level: string): winston.Logger => {
  const logger = winston.createLogger({
    level,
    format: winston.format.json(),
    defaultMeta: { service: 'human-protocol' },
    transports: [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({ filename: 'logs/all.log' }),
    ],
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      })
    );
  }

  return logger;
};
