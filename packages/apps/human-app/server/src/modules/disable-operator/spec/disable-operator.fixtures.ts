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
const RESPONSE_FROM = 'test_response_from';
const RESPONSE_TO = 'test_response_to';
const RESPONSE_CONTENTS = 'test_response_contents';
const RESPONSE = {
  from: RESPONSE_FROM,
  to: RESPONSE_TO,
  contents: RESPONSE_CONTENTS,
};

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

export const prepareSignatureResponseFixture: PrepareSignatureResponse =
  RESPONSE;

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
