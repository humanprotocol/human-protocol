import logger from '../src';

// to log simple message
logger.info('Info without any context');

// to log message with some context info
logger.info('New user registered', {
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64; rv:100.0) Gecko/20100101 Firefox/83.0',
  country: 'Anguilla',
  ip: '127.0.0.1',
  email: 'john.doe@logger.lib',
});

// to log an error
class CustomError extends Error {
  constructor(readonly details: string) {
    super('Custom error happened');
    /**
     * Haven't assigned 'name' from 'this.constructor.name',
     * but in example you should see correct error kind anyways.
     */
  }
}
logger.error(
  'Something went wrong 1',
  new CustomError('Error as whole second argument'),
);
logger.error('Something went wrong 2', {
  error: new CustomError('Error as specific key for errors'),
});

// logging custom error with toJSON
class ErrorWithToJSON extends CustomError {
  constructor(readonly toLog: string) {
    super('Error has toJSON and "details" prop will not be logged');
  }

  toJSON() {
    return {
      name: this.name,
      stack: this.stack,
      toLog: this.toLog,
    };
  }
}
logger.error('Logging custom error with toJSON', new ErrorWithToJSON('No way'));

// or error with some extra context
const extra = {
  field: 'status',
  newValue: 'active',
};
logger.error('Error updating some entity', {
  error: new Error('Failed to update example entity'),
  entityId: 42,
  ...extra,
});

// to log anything
logger.debug('Show me value', 42n);

// named logger
const loggerName = 'example-named-logger';
const namedLogger = logger.child({ name: loggerName });
namedLogger.debug('name should be', loggerName);

// context logger
const context = 'example-context';
const contextLogger = logger.child({ context });
contextLogger.info('Helpful info', {
  expectedContext: context,
});
