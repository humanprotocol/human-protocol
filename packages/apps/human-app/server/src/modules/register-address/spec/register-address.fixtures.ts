import {
  RegisterAddressCommand,
  RegisterAddressData,
  RegisterAddressDto,
  RegisterAddressResponse,
} from '../model/register-address.model';
const ADDRESS = '0xsome_address';
const SIGNATURE = '0xsome_signature';
export const REGISTER_ADDRESS_TOKEN = 'my_access_token';
const RESPONSE_ADDRESS = 'signed_address_response';
export const registerAddressDtoFixture: RegisterAddressDto = {
  address: ADDRESS,
  signature: SIGNATURE,
};
export const registerAddressCommandFixture: RegisterAddressCommand = {
  address: ADDRESS,
  token: REGISTER_ADDRESS_TOKEN,
  signature: SIGNATURE,
};
export const registerAddressDataFixture: RegisterAddressData = {
  address: ADDRESS,
  signature: SIGNATURE,
};
export const registerAddressResponseFixture: RegisterAddressResponse = {
  signed_address: RESPONSE_ADDRESS,
};
