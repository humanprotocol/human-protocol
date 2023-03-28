export interface IKeyPair {
  privateKey: string;
  publicKey: string;
  mnemonic: string;
  revocationCertificate?: string;
}

export interface IEncryptMessage {
  privateKey: string;
  publicKeys: string[];
  mnemonic: string;
  message: string;
}

export interface IDecryptMessage {
  privateKey: string;
  publicKey: string;
  mnemonic: string;
  message: string;
}


export interface ISignMessage {
  privateKey: string;
  mnemonic: string;
  message: string;
}

export interface IVerifyMessage {
  publicKey: string;
  message: string;
}
