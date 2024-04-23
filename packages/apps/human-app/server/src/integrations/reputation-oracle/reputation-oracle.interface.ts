import { SignupWorkerData } from '../../modules/user-worker/model/worker-registration.model';
import { SignupOperatorData } from '../../modules/user-operator/model/operator-registration.model';
import { SigninWorkerData } from '../../modules/user-worker/model/worker-signin.model';
import { EmailVerificationData } from '../../modules/email-confirmation/model/email-verification.model';
import { ResendEmailVerificationData } from '../../modules/email-confirmation/model/resend-email-verification.model';

export type RequestDataType =
  | SignupWorkerData
  | SignupOperatorData
  | SigninWorkerData
  | EmailVerificationData
  | ResendEmailVerificationData;
