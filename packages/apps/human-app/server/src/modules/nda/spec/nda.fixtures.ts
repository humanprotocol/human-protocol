import {
  GetNDACommand,
  GetNDAResponse,
  SignNDACommand,
  SignNDAData,
  SignNDADto,
  SignNDAResponse,
} from '../model/nda.model';

const URL = 'http://some_url.com';
export const NDA_TOKEN = 'my_access_token';

export const signNDADtoFixture: SignNDADto = {
  url: URL,
};
export const signNDACommandFixture: SignNDACommand = {
  url: URL,
  token: NDA_TOKEN,
};
export const signNDADataFixture: SignNDAData = {
  url: URL,
};
export const signNDAResponseFixture: SignNDAResponse = {
  message: 'NDA signed successfully',
};

export const getNDACommandFixture: GetNDACommand = {
  token: NDA_TOKEN,
};

export const getNDAResponseFixture: GetNDAResponse = {
  url: 'URL',
};
