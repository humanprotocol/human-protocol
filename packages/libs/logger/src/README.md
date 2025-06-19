Custom logger implementation for use in Node.js HUMAN apps.

Provides standartized API and writes logs in pre-defined JSON format:
```json
{
  "level": "debug",
  "message": "Some info about error",
  "timestamp": 1738937400037,
  "error": {
    "kind": "CustomError",
    "message": "Message from custom error",
    "stack": "CustomError: Message from custom error\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)",
    "customErrorProp": "error-detail-prop"
  }
  // ...merging meta
}
```
:information_source: Error formatting is done only for error argument and "error" context property.

Pretty-printing is enabled for local/development environment by default.

### Usage examples
At the moment preferred underlying logger is `pino`. Corresponding file exports `createLogger` factory function that is used to create pre-configured default logger intance, that has service/app name and environment bound to all log messages.

Import the pre-defined logger
```ts
import logger from '<relative_path_to>/logger';
```
then use it as per API contract: with log message first and any useful detail in log meta
:information_source: If meta is not a plain object and not an error - it is being logged as "meta" property
```ts
// to log simple message
logger.info('Info without any context');

// to log message with some context info
loger.info('New user registered', {
  userAgent,
  country,
  ip,
  email,
});

// to log error
logger.error('Something went wrong', error);

// or error with some extra context
logger.error('Error updating some entity', {
  error,
  entityId: 42,
  ...extra
});

// to log anything
logger.debug('Show me value', someValue);
```

If needed, you can create named logger
```ts
const utilsLogger = logger.child({ name: 'UtilsLogger' })
// ....
utilsLogger.debug('input params', args);
/*
{
  "level": "debug",
  "logger": "UtilsLogger",
  "message": "input params",
  "timestamp": 1738937400037
  ...
}
*/
```
or bind a "context" (or any other) prop to it
```ts
const contextLogger = logger.child({ context: 'SomeService' })
// ....
contextLogger.info('Helpful info', context);
/*
{
  "level": "debug",
  "context": "SomeService",
  "message": "Helpful info",
  "timestamp": 1738937400037,
  ...
}
*/
```