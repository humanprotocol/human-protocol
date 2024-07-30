import { prepareKycProcedureStartResponseFixture } from './kyc-procedure.fixtures';

export const serviceMock = {
  processStartKycProcedure: jest
    .fn()
    .mockReturnValue(prepareKycProcedureStartResponseFixture),
  processKycOnChain: jest.fn(),
};
