# @human-protocol/logger

A unified logging package for Human Protocol services and oracles, based on Pino with NestJS integration. This package follows the same pattern as the Reputation Oracle logger.

## Features

- **Unified logging interface** across all services and oracles
- **Pino-based** for high performance logging
- **NestJS integration** with custom logger override
- **Structured logging** with metadata support
- **Error serialization** with stack traces
- **Environment-aware** configuration (development, production, test)
- **Pretty printing** for development environments
- **Singleton pattern** with child loggers for context

## Installation

```bash
npm install @human-protocol/logger
```

## Usage

### Basic Logger (Reputation Oracle Style)

```typescript
import logger from '@human-protocol/logger';

// Use the default logger
logger.info('Service started');
logger.error('An error occurred', new Error('Something went wrong'));
logger.debug('Debug information', { userId: 123, action: 'login' });

// Create child loggers with context
const serviceLogger = logger.child({
  context: 'MyService',
});

serviceLogger.info('Service operation completed');
serviceLogger.error('Service error', { operation: 'create', userId: 123 });
```

### NestJS Integration

```typescript
import logger, { nestLoggerOverride } from '@human-protocol/logger';

// In your main.ts
const app = await NestFactory.create(AppModule, {
  logger: nestLoggerOverride,
});

// Use the logger in your app
logger.info(`API server is running on http://${host}:${port}`);
```

### Service Implementation

```typescript
import { Injectable } from '@nestjs/common';
import logger from '@human-protocol/logger';

@Injectable()
export class MyService {
  private readonly logger = logger.child({
    context: MyService.name,
  });

  doSomething() {
    this.logger.info('Something happened');
    this.logger.error('An error occurred', new Error('Something went wrong'));
  }
}
```

### Child Loggers

```typescript
import logger from '@human-protocol/logger';

const userLogger = logger.child({ component: 'user-service' });
const paymentLogger = logger.child({ component: 'payment-service' });

userLogger.info('User created', { userId: 123 });
paymentLogger.info('Payment processed', { paymentId: 'pay_123' });
```

### Custom Logger (Advanced)

```typescript
import { createLogger, LogLevel } from '@human-protocol/logger';

const logger = createLogger(
  {
    name: 'CustomLogger',
    level: LogLevel.DEBUG,
    pretty: true,
    disabled: false,
  },
  {
    service: 'my-service',
    environment: 'development',
  },
);
```

## API Reference

### Default Exports

- `logger` - The default logger instance (singleton)
- `nestLoggerOverride` - NestJS logger override for app-wide logging

### `logger.child(bindings)`

Creates a child logger with additional context.

**Parameters:**
- `bindings` (ChildBindings): Additional metadata bindings

### `createLogger(options, bindings)`

Creates a custom logger with full configuration.

**Parameters:**
- `options` (LoggerOptions): Logger configuration
- `bindings` (LogMeta): Additional metadata bindings

### Logger Interface

```typescript
interface Logger {
  debug(message: string, errorOrMeta?: unknown): void;
  info(message: string, errorOrMeta?: unknown): void;
  warn(message: string, errorOrMeta?: unknown): void;
  error(message: string, errorOrMeta?: unknown): void;
  child(bindings: ChildBindings): Logger;
}
```

## Log Levels

- `DEBUG`: Detailed debug information
- `INFO`: General information messages
- `WARN`: Warning messages
- `ERROR`: Error messages

## Environment Configuration

The logger automatically adapts based on the environment:

- **Development**: Debug level, pretty printing enabled
- **Production**: Info level, structured JSON output
- **Test**: Logging disabled by default

## Migration from Existing Loggers

### From NestJS Logger

**Before:**
```typescript
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);
  
  doSomething() {
    this.logger.log('Something happened');
  }
}
```

**After:**
```typescript
import logger from '@human-protocol/logger';

export class MyService {
  private readonly logger = logger.child({
    context: MyService.name,
  });
  
  doSomething() {
    this.logger.info('Something happened');
  }
}
```

### From Reputation Oracle Local Logger

**Before:**
```typescript
import logger from '../../logger';

export class MyService {
  private readonly logger = logger.child({
    context: MyService.name,
  });
}
```

**After:**
```typescript
import logger from '@human-protocol/logger';

export class MyService {
  private readonly logger = logger.child({
    context: MyService.name,
  });
}
```

## Examples

### Complete Service Example

```typescript
import { Injectable } from '@nestjs/common';
import logger from '@human-protocol/logger';

@Injectable()
export class UserService {
  private readonly logger = logger.child({
    context: UserService.name,
  });

  async createUser(userData: any) {
    try {
      this.logger.info('Creating user', { email: userData.email });
      
      // ... user creation logic
      
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw error;
    }
  }

  async getUser(userId: string) {
    this.logger.debug('Fetching user', { userId });
    
    // ... user fetching logic
    
    return user;
  }
}
```

### Main Application Setup

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import logger, { nestLoggerOverride } from '@human-protocol/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: nestLoggerOverride,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.info(`Application is running on port ${port}`);
}

bootstrap();
``` 