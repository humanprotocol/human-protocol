import { SignupWorkerData } from '../../modules/user-worker/interfaces/worker-registration.interface';
import { SignupOperatorData } from '../../modules/user-operator/interfaces/operator-registration.interface';
import { SigninWorkerData } from '../../modules/user-worker/interfaces/worker-signin.interface';

export type RequestDataType =
  | SignupWorkerData
  | SignupOperatorData
  | SigninWorkerData;
