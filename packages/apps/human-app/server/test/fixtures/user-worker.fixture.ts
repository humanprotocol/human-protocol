import { UserType } from '../../src/common/enums/user';

export function generateWorkerSignupRequestBody() {
  const randomElement = Math.floor(Math.random() * 1000);
  return {
    email: `john_doe${randomElement}@example.com`,
    password: 'v3ry57r0n9P455w0r[)!',
    h_captcha_token: '342dsfgisg8932resadz231y58sdf9adsf',
    type: UserType.WORKER.toString(),
  };
}
