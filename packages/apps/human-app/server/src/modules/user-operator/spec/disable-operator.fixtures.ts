import {
  DisableOperatorCommand,
  DisableOperatorData,
  DisableOperatorParams,
} from '../model/disable-operator.model';

const SIGNATURE = 'test_signature';
const TOKEN = 'test_user_token';

export const disableOperatorTokenFixture = TOKEN;

export const disableOperatorParamsFixture: DisableOperatorParams = {
  signature: SIGNATURE,
};

export const disableOperatorCommandFixture: DisableOperatorCommand = {
  data: disableOperatorParamsFixture,
  token: disableOperatorTokenFixture,
};

export const disableOperatorDataFixture: DisableOperatorData = {
  signature: SIGNATURE,
};
