import { Address } from '@multiversx/sdk-core/out';
import { Mnemonic, UserSigner } from '@multiversx/sdk-wallet/out';
import Web3 from 'web3';
import { EscrowContract } from './escrow.interface';
import { MxService } from './mx.service';
import { Web3Service } from './web3.service';

export function processAddress(address: string, web3: Web3): string | Address {
  if (web3.utils.isAddress(address)) {
    return address;
  }
  try {
    return new Address(address);
  } catch (e) {
    throw new Error(`Invalid address: ${address}`);
  }
}

export function getServiceForAddress(
  address: string | Address,
  web3: Web3,
  mxSigner: UserSigner
): EscrowContract {
  if (address instanceof Address) {
    return new MxService(address, mxSigner);
  }

  return new Web3Service(address, web3);
}

export function initWeb3(ethHttpServer: string, privKey: string): Web3 {
  const web3 = new Web3(ethHttpServer);
  const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  return web3;
}

export function initMxSigner(privKey: string): UserSigner {
  const mnemonic = Mnemonic.fromString(privKey).deriveKey(0);

  return new UserSigner(mnemonic);
}
