import {
  DisableOperatorCommand,
  DisableOperatorData,
  DisableOperatorDto,
  DisableOperatorParams,
} from '../model/disable-operator.model';

const SIGNATURE = 'test_signature';
const TOKEN = 'test_user_token';

export const disableOperatorTokenFixture = TOKEN;

export const disableOperatorDtoFixture: DisableOperatorDto = {
  signature: SIGNATURE,
};

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
