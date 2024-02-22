import { UserType } from '../../src/common/enums/user';

export function generateWorkerSignupRequestBody() {
  const randomElement = Math.floor(Math.random() * 1000);
  return {
    email: `john_doe${randomElement}@example.com`,
    password: 'v3ry57r0n9P455w0r[)!',
    type: UserType.WORKER.toString(),
  };
}
