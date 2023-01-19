import { IEscrowNetwork } from 'constants/networks';
import Web3 from 'web3';

const privKey = process.env.ETH_PRIVATE_KEY ||
    '';

export const createWeb3 = (network: IEscrowNetwork) => {
    const ethHttpServer = network.rpcUrl as string;
    const web3 = new Web3(ethHttpServer);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    return web3;
}