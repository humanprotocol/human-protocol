import * as openpgp from 'openpgp';
import * as bip39 from "bip39"
import { IDecryptMessage, IEncryptMessage, IKeyPair, ISignMessage, IVerifyMessage } from '../interfaces/encryption';


export async function encrypt(data: IEncryptMessage): Promise<string> {
  const publicKeysArmored = data.publicKeys;
  const privateKeyArmored = data.privateKey;
  const passphrase = data.mnemonic;
  const plaintext = data.message;
  
  const publicKeys = await Promise.all(publicKeysArmored.map(armoredKey => openpgp.readKey({ armoredKey })));
  
  const privateKey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
    passphrase
  });
  
  const message = await openpgp.createMessage({ text: plaintext });
  const encrypted = await openpgp.encrypt({
    message,
    encryptionKeys: publicKeys,
    signingKeys: privateKey
  });

  return encrypted as string;
}

export async function decrypt(data: IDecryptMessage): Promise<string> {
  const publicKey = await openpgp.readKey({ armoredKey: data.publicKey });

  const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: data.privateKey }),
      passphrase: data.mnemonic
  });

  const message = await openpgp.readMessage({
      armoredMessage: data.message
  });

  const { data: decrypted, signatures } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
      expectSigned: true,
      verificationKeys: publicKey, // mandatory with expectSigned=true
  });
  console.log(decrypted, signatures);
  return decrypted as string;
}

export async function sign(data: ISignMessage): Promise<string> { 
  const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: data.privateKey }),
      passphrase: data.mnemonic
  });

  const unsignedMessage = await openpgp.createCleartextMessage({ text: data.message });
  
  const cleartextMessage = await openpgp.sign({
      message: unsignedMessage,
      signingKeys: privateKey,
      format: 'armored' 
  });

  console.log(unsignedMessage)
  
  return cleartextMessage;
}

export async function verify(data: IVerifyMessage): Promise<boolean> { 
  const publicKey = await openpgp.readKey({ armoredKey: data.publicKey });

  const signedMessage = await openpgp.readCleartextMessage({
      cleartextMessage: data.message
  });

  const verificationResult = await signedMessage.verify([publicKey])
  
  const { verified, keyID } = verificationResult[0];

  try {
      console.log('Signed by key id ' + keyID.toHex());
      return await verified;
  } catch (e) {
      throw new Error('Signature could not be verified: ' + e.message);
  }
}

export async function getSignedData(message: string): Promise<any> { 
  const signedMessage = await openpgp.readCleartextMessage({
      cleartextMessage: message
  });

  try {
      return JSON.parse(signedMessage.getText());
  } catch (e) {
      throw new Error('Signature could not be verified: ' + e.message);
  }
}

export async function generateKeyPair(): Promise<IKeyPair> {
  const mnemonic = bip39.generateMnemonic()

  const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
    type: 'ecc',
    curve: 'ed25519',
    userIDs: [{ name: 'Human Protocol', email: 'human@hmt.ai' }],
    passphrase: mnemonic,
    format: 'armored'
  });

  return {
    mnemonic,
    privateKey,
    publicKey,
    revocationCertificate
  };
}