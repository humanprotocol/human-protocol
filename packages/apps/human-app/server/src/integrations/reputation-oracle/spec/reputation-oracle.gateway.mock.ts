export const reputationOracleGatewayMock = {
  sendWorkerSignup: jest.fn(),
  sendOperatorSignup: jest.fn(),
  sendWorkerSignin: jest.fn(),
  sendEmailVerification: jest.fn(),
  resendSendEmailVerification: jest.fn(),
  sendForgotPassword: jest.fn(),
  sendRestorePassword: jest.fn(),
};
