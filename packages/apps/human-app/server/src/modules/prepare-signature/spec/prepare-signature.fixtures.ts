import {
  PrepareSignatureCommand,
  PrepareSignatureData,
  PrepareSignatureDto,
  PrepareSignatureResponse,
} from '../model/prepare-signature.model';
import { SignatureType } from '../../../common/enums/global-common';

const ADDRESS = 'test_address';
const TYPE: SignatureType = SignatureType.SIGNUP;
const RESPONSE_FROM = 'test_response_from';
const RESPONSE_TO = 'test_response_to';
const RESPONSE_CONTENTS = 'test_response_contents';
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
};

export const prepareSignatureDataFixture: PrepareSignatureData = {
  address: ADDRESS,
  type: TYPE,
};

export const prepareSignatureResponseFixture: PrepareSignatureResponse =
  RESPONSE;
