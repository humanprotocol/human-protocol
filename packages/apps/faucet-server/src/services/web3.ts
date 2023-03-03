import hmtAbi from '@human-protocol/core/abis/HMToken.json';
import Web3 from 'web3';

export const getWeb3 = async (rpcUrl: string): Promise<Web3> => {
  const web3 = new Web3(rpcUrl);
  const faucetAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${process.env.PRIVATE_KEY}`
  );
  web3.eth.accounts.wallet.add(faucetAccount);
  web3.eth.defaultAccount = faucetAccount.address;
  return web3;
};

export const getFaucetBalance = async (web3: Web3, hmtAddress: string) => {
  const HMT = new web3.eth.Contract(hmtAbi as [], hmtAddress);
  const balance = web3.utils.fromWei(
    await HMT.methods.balanceOf(web3.eth.defaultAccount).call(),
    'ether'
  );
  return balance;
};

export const sendFunds = async (
  web3: Web3,
  hmtAddress: string,
  toAddress: string
): Promise<string | undefined> => {
  const HMT = new web3.eth.Contract(hmtAbi as [], hmtAddress);
  let txHash = '';
  try {
    const gasNeeded = await HMT.methods
      .transfer(
        toAddress,
        Web3.utils.toWei(process.env.DAILY_LIMIT as string, 'ether')
      )
      .estimateGas({ from: web3.eth.defaultAccount });
    const gasPrice = await web3.eth.getGasPrice();

    const receipt = await HMT.methods
      .transfer(
        toAddress,
        Web3.utils.toWei(process.env.DAILY_LIMIT as string, 'ether')
      )
      .send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });
    txHash = receipt.transactionHash;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return undefined;
  }

  return txHash;
};
