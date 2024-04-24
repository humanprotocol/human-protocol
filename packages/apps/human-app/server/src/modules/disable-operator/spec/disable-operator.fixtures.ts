import { PrepareSignatureType } from '../../../common/enums/global-common.interface';
import {
  PrepareSignatureCommand,
  PrepareSignatureData,
  PrepareSignatureDto,
  PrepareSignatureResponse,
} from '../model/prepare-signature.model';
import {
  DisableOperatorCommand,
  DisableOperatorData,
  DisableOperatorDto,
  DisableOperatorParams,
} from '../model/disable-operator.model';

const ADDRESS = 'test_address';
const TYPE: PrepareSignatureType = PrepareSignatureType.SIGNUP;
const SIGNATURE = 'test_signature';
const TOKEN = 'test_user_token';

export const prepareSignatureDtoFixture: PrepareSignatureDto = {
  address: ADDRESS,
  type: TYPE,
};

export const prepareSignatureCommandFixture: PrepareSignatureCommand = {
  address: ADDRESS,
  type: TYPE,
};

export const prepareSignatureDataFixture: PrepareSignatureData = {
  address: ADDRESS,
  type: TYPE,
};

export const prepareSignatureResponseFixture: PrepareSignatureResponse = {
  from: 'string',
  to: 'string',
  contents: 'string',
};

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
