import dotenv from 'dotenv';
dotenv.config({ path: `.env.development` });
import HMToken from '@human-protocol/core/artifacts/contracts/HMToken.sol//HMToken.json';
import { describe, expect, it } from '@jest/globals';
import { getFaucetBalance, sendFunds } from './web3';
import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';

let token: Contract;

const web3 = new Web3('http://127.0.0.1:8549');
const owner = web3.eth.accounts.privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
);
web3.eth.defaultAccount = owner.address;
const externalUser = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f';

describe('Faucet', () => {
  beforeEach(async () => {
    const tokenContract = new web3.eth.Contract(HMToken.abi as []);
    token = await tokenContract
      .deploy({
        data: HMToken.bytecode,
        arguments: [
          web3.utils.toWei('100000', 'ether'),
          'Human Token',
          18,
          'HMT',
        ],
      })
      .send({
        from: owner.address,
      });
  });

  it('Check faucet balance before send', async () => {
    const result = await getFaucetBalance(web3, token.options.address);

    expect(result).toBe(web3.utils.toWei('100000', 'ether'));
  });

  it('Send balance', async () => {
    const oldFaucetBalance = await getFaucetBalance(
      web3,
      token.options.address
    );
    const oldUserBalance = await token.methods.balanceOf(externalUser).call();

    await sendFunds(web3, token.options.address, externalUser);

    const newFaucetBalance = await getFaucetBalance(
      web3,
      token.options.address
    );
    const newUserBalance = await token.methods.balanceOf(externalUser).call();

    expect(Number(newFaucetBalance)).toBe(Number(oldFaucetBalance) - 10);
    expect(oldUserBalance).toBe(
      web3.utils
        .toBN(newUserBalance)
        .sub(web3.utils.toBN(web3.utils.toWei('10', 'ether')))
        .toString()
    );
  });
});
