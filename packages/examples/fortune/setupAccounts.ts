/* eslint-disable no-console */
import Web3 from 'web3';
import HMTokenAbi from '@human-protocol/core/abis/HMToken.json';
import StakingAbi from '@human-protocol/core/abis/Staking.json';

export const stake = async (web3: Web3) => {
  const stakingAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
  const stakeAmount = web3.utils.toWei('10', 'ether');

  await approve(web3, stakingAddress, stakeAmount);

  const stakingContract = new web3.eth.Contract(
    StakingAbi as [],
    stakingAddress
  );
  const gas = await stakingContract.methods
    .stake(stakeAmount)
    .estimateGas({ from: web3.eth.defaultAccount });
  const gasPrice = await web3.eth.getGasPrice();
  await stakingContract.methods
    .stake(stakeAmount)
    .send({ from: web3.eth.defaultAccount, gas, gasPrice });
};
export const approve = async (web3: Web3, to: string, amount: string) => {
  const hmtContract = new web3.eth.Contract(
    HMTokenAbi as [],
    '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  );
  const gas = await hmtContract.methods
    .approve(to, amount)
    .estimateGas({ from: web3.eth.defaultAccount });
  const gasPrice = await web3.eth.getGasPrice();
  await hmtContract.methods
    .approve(to, amount)
    .send({ from: web3.eth.defaultAccount, gas, gasPrice });
};

async function main() {
  const web3 = new Web3('http://127.0.0.1:8545');
  const jobRequester = web3.eth.accounts.privateKeyToAccount(
    `0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e`
  );
  web3.eth.defaultAccount = jobRequester.address;
  await stake(web3);
  const reputationOracle = web3.eth.accounts.privateKeyToAccount(
    `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
  );
  web3.eth.defaultAccount = reputationOracle.address;
  await stake(web3);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
