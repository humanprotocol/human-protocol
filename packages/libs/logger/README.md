## HUMAN Protocol Node.js logger

Custom logger implementation for use in Node.js HUMAN Protocol apps.

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

## Logger initialization and usage

### Pre-created logger instance
By defaul this library exports pre-created logger instance that you can start using immediately. This logger is pre-configured with:
  - zero-bindings (only `name` is set up as `human-protocol-logger`)
  - pretty-printing and structured log format
  - has `debug` as its minimum level to log

To use it:
```ts
import logger from '@human-protocol/logger';

logger.info('Some message', { some: 'extras' });
```
It's expected to be used only in dev environments, such as a developer toolbox, some local scripts and etc.

### Create application logger with factory function

Lib exports `createLogger` factory function that should be used to create a logger intance with proper bindings for application. Recommended bindings are at least `service` and `environment`, so that you can distinguish logs coming from different sources in your log-management system easilly.

```ts
import { createLogger, LogLevel } from '@human-protocol/logger';

const ENV_NAME = process.NODE_ENV || 'development';
const isDevelopment = ENV_NAME === 'development';
const isTest = process.NODE_ENV === 'test'

const defaultAppLogger = createLogger(
  {
    name: 'DefaultLogger',
    level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    pretty: isDevelopment,
    disabled: isTest,
  },
  {
    environment: ENV_NAME,
    service: 'you-application-name',
  },
);

export default defaultAppLogger;

// import it somewehre in your app and use
import logger from '<relative_path_to>/logger';

logger.info('Some application log', { with: 'useful-context' });
```

### Replacing default Nest.js logger
Once you have your application logger instance created, you can replace default Nest.js logger with it, so anything that comes from your appication follows the same format. This library provides a helper for that:

```ts
import { NestLogger } from '@human-protocol/logger';

// initialize an overridden instance
export const nestLoggerOverride = new NestLogger(
  defaultAppLogger.child({ name: 'NestLogger' }),
);


// init you Nest.js app with overriden instance
const app = await NestFactory.create(AppModule, {
  logger: nestLoggerOverride,
});

// Logger is `nestLoggerOverride` now
import { Logger } from '@nestjs/common';
```

## Usage examples
Logger has next API contract: log message first and any useful detail in log meta as a second argument.

:information_source: If meta is not a plain object and not an error - it is being logged as "meta" property

:information_source: Error formatting is done only for error argument and "error" context property.

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

// to log an error
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

If needed, you can create a named logger
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
const contextLogger = logger.child({ context: 'SomeClassOrMethod' })
// ....
contextLogger.info('Helpful info', context);
/*
{
  "level": "debug",
  "context": "SomeClassOrMethod",
  "message": "Helpful info",
  "timestamp": 1738937400037,
  ...
}
*/
```