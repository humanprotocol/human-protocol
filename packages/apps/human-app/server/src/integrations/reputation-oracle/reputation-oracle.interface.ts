import { SignupWorkerData } from '../../modules/user-worker/model/worker-registration.model';
import { SignupOperatorData } from '../../modules/user-operator/model/operator-registration.model';
import { SigninWorkerData } from '../../modules/user-worker/model/worker-signin.model';

export type RequestDataType =
  | SignupWorkerData
  | SignupOperatorData
  | SigninWorkerData;
