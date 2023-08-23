import { verifySignature, recoverSigner, signMessage } from "./signature";
import { ethers } from "ethers";
import { MOCK_ADDRESS, MOCK_PRIVATE_KEY } from "../../../test/constants";
import { ErrorSignature } from "../constants/errors";

describe('Signature utility', () => {
  describe('verifySignature', () => {
    it('should return true for valid signature', async () => {
        const message = "Hello, this is a signed message!";
        const wallet = new ethers.Wallet(MOCK_PRIVATE_KEY);
        const signature = await wallet.signMessage(message)

        const result = verifySignature(message, signature, wallet.address);

        expect(result).toBe(true);
    });

    it('should throw conflict exception for signature not verified', async () => {
        const message = "Hello, this is a signed message!";
        const wallet = new ethers.Wallet(MOCK_PRIVATE_KEY);

        const invalidSignature = await wallet.signMessage(message)

        expect(() => {
            verifySignature(message, invalidSignature, MOCK_ADDRESS);
        }).toThrow(ErrorSignature.SignatureNotVerified);
    });


    it('should throw conflict exception for invalid signature', () => {
      const message = "Hello, this is a signed message!";
      const invalidSignature = "0xInvalidSignature";

      expect(() => {
        verifySignature(message, invalidSignature, MOCK_ADDRESS);
      }).toThrow(ErrorSignature.InvalidSignature);
    });
  });

  describe('recoverSigner', () => {
    it('should recover the correct signer', async () => {
        const message = "value";
        const wallet = new ethers.Wallet(MOCK_PRIVATE_KEY);
        const signature = await wallet.signMessage(message)

        const result = recoverSigner(message, signature);

        expect(result).toBe(wallet.address);
    });

    it('should throw conflict exception for invalid signature', () => {
        const message = "Hello, this is a signed message!";
        const invalidSignature = "0xInvalidSignature";
  
        expect(() => {
            recoverSigner(message, invalidSignature);
        }).toThrow(ErrorSignature.InvalidSignature);
      });
  });

  describe('signMessage', () => {
    it('should return a valid signature', async () => {
      const message = "Hello, this is a test message";
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      expect(signature).toBeDefined();
    });
  });
});
