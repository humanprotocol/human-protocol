import { Logger } from '../types';

const logger: Logger = {
  child: jest.fn(() => logger),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

export default logger;
