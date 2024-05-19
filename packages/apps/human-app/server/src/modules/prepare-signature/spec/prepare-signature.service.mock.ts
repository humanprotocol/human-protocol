import { prepareSignatureResponseFixture } from './prepare-signature.fixtures';

export const serviceMock = {
  processPrepareSignature: jest
    .fn()
    .mockReturnValue(prepareSignatureResponseFixture),
};
