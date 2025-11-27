import {
  enrollExchangeApiKeysResponseFixture,
  retrieveExchangeApiKeysResponseFixture,
} from './exchange-api-keys.fixtures';

export const exchangeApiKeysServiceMock = {
  enroll: jest.fn().mockReturnValue(enrollExchangeApiKeysResponseFixture),
  delete: jest.fn().mockResolvedValue(undefined),
  retrieve: jest.fn().mockReturnValue(retrieveExchangeApiKeysResponseFixture),
};
