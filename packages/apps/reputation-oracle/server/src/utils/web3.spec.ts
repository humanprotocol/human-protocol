import { faker } from '@faker-js/faker';

import { generateEthWallet } from '@/test/fixtures/web3';

import * as web3Utils from './web3';

const PERMANENT_PRIVATE_KEY =
  '0x85dc77260240f78982bdfdfc0a0cb241a85d2f9833468fae7ec362ec7829ce3a';
const PERMANENT_ADDRESS = '0x9dfB81606Af98a4776a28Ae0Ae30DA3567ae4B98';
const PERMANENT_MESSAGE = 'Permanent message to validate exact signature';
const PERMANENT_SIGNATURE =
  '0xf6f61e466793e672bb595f2d86fa9c5bbaadc21f0293e12be86c1f87cdac7d823dec35e40cfecd60e07e933ee256e136c171e42f58eb7b95d9d0bfb7cedf754b1c';

describe('Web3 utilities', () => {
  let privateKey: string;
  let address: string;

  beforeEach(() => {
    ({ privateKey, address } = generateEthWallet());
  });

  describe('signMessage', () => {
    const signatureRegex = /^0x[0-9a-fA-F]{130}$/;

    it('should sign message when it is a string', async () => {
      const message = faker.lorem.words();

      const signature = await web3Utils.signMessage(message, privateKey);

      expect(signature).toMatch(signatureRegex);
    });

    it('should sign message when it is an object', async () => {
      const message = {
        [faker.string.sample()]: new Date(),
      };

      const signature = await web3Utils.signMessage(message, privateKey);

      expect(signature).toMatch(signatureRegex);
    });

    it('should return exact signature', async () => {
      const signature = await web3Utils.signMessage(
        PERMANENT_MESSAGE,
        PERMANENT_PRIVATE_KEY,
      );

      expect(signature).toBe(PERMANENT_SIGNATURE);
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid exact signature', async () => {
      const result = web3Utils.verifySignature(
        PERMANENT_MESSAGE,
        PERMANENT_SIGNATURE,
        [PERMANENT_ADDRESS],
      );

      expect(result).toBe(true);
    });

    it('should return true for valid signature', async () => {
      const message = faker.lorem.words();

      const signature = await web3Utils.signMessage(message, privateKey);

      const result = web3Utils.verifySignature(message, signature, [address]);

      expect(result).toBe(true);
    });

    it('should return false if signature is not valid', async () => {
      const message = faker.lorem.words();
      const invalidSignature = '0xInvalidSignature';

      const result = web3Utils.verifySignature(message, invalidSignature, [
        address,
      ]);

      expect(result).toBe(false);
    });

    it('should return false when signature not verified', async () => {
      const message = faker.lorem.words();

      const signature = await web3Utils.signMessage(message, privateKey);

      const { address: anotherSignerAddress } = generateEthWallet();
      const result = web3Utils.verifySignature(message, signature, [
        anotherSignerAddress,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('recoverSignerAddress', () => {
    it('should recover the exact signer', async () => {
      const result = web3Utils.recoverSignerAddress(
        PERMANENT_MESSAGE,
        PERMANENT_SIGNATURE,
      );

      expect(result).toBe(PERMANENT_ADDRESS);
    });

    it('should recover the correct signer', async () => {
      const message = faker.lorem.words();
      const signature = await web3Utils.signMessage(message, privateKey);

      const result = web3Utils.recoverSignerAddress(message, signature);

      expect(result).toBe(address);
    });

    it('should return null for invalid signature', () => {
      const message = faker.lorem.words();
      const invalidSignature = '0xInvalidSignature';

      const signer = web3Utils.recoverSignerAddress(message, invalidSignature);

      expect(signer).toBe(null);
    });

    it('should recover the correct signer if message is an object', async () => {
      const message = {
        [faker.string.sample()]: new Date(),
      };
      const signature = await web3Utils.signMessage(message, privateKey);

      const recoveredAddress = web3Utils.recoverSignerAddress(
        message,
        signature,
      );

      expect(recoveredAddress).toBe(address);
    });
  });

  describe('prepareSignatureBody', () => {
    it('should prepare proper signature body', () => {
      const from = generateEthWallet().address;
      const to = generateEthWallet().address;
      const contents = faker.string.alphanumeric();
      const nonce = faker.string.alphanumeric();

      const preparedSignatureBody = web3Utils.prepareSignatureBody({
        from,
        to,
        contents,
        nonce,
      });

      expect(preparedSignatureBody).toEqual({
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        contents,
        nonce,
      });
    });

    it('should not have nonce if not provided', () => {
      const from = generateEthWallet().address;
      const to = generateEthWallet().address;
      const contents = faker.string.alphanumeric();

      const preparedSignatureBody = web3Utils.prepareSignatureBody({
        from,
        to,
        contents,
      });

      expect(preparedSignatureBody).toEqual({
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        contents,
      });
    });
  });
});
