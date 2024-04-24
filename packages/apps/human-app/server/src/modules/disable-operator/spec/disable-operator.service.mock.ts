import { prepareSignatureResponseFixture } from './disable-operator.fixtures';

export const serviceMock = {
  processPrepareSignature: jest
    .fn()
    .mockReturnValue(prepareSignatureResponseFixture),
  processDisableOperator: jest.fn(),
};
