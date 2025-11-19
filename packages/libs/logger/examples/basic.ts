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
logger.error('Something went wrong', new Error('Very surprising error'));

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
