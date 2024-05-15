import { PrepareSignatureType } from '../../../common/enums/global-common';
import {
  PrepareSignatureCommand,
  PrepareSignatureData,
  PrepareSignatureDto,
  PrepareSignatureResponse,
} from '../model/prepare-signature.model';

const ADDRESS = 'test_address';
const TYPE: PrepareSignatureType = PrepareSignatureType.SIGNUP;
const RESPONSE_FROM = 'test_response_from';
const RESPONSE_TO = 'test_response_to';
const RESPONSE_CONTENTS = 'test_response_contents';
export const TOKEN = 'my_access_token';
export const RESPONSE = {
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
  token: TOKEN,
};

export const prepareSignatureDataFixture: PrepareSignatureData = {
  address: ADDRESS,
  type: TYPE,
};

export const prepareSignatureResponseFixture: PrepareSignatureResponse =
  RESPONSE;
