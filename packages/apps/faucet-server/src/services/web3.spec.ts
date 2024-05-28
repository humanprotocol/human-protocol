/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TODO: Remove eslint rule for explict any after the PR is merged
 * Known issue for web3 v4 unknown ABI
 * https://github.com/web3/web3.js/pull/6636
 */

import dotenv from 'dotenv';
import HMToken from '@human-protocol/core/artifacts/contracts/HMToken.sol/HMToken.json';
import { describe, expect, it } from '@jest/globals';
import {
  checkFaucetBalance,
  getFaucetBalance,
  getHmtBalance,
  sendFunds,
} from './web3';
import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';

dotenv.config({ path: `.env.example` });

let token: Contract<typeof HMToken.abi>;

const web3 = new Web3('http://127.0.0.1:8549');
const owner = web3.eth.accounts.privateKeyToAccount(
  `0x${process.env.PRIVATE_KEY}`
);
web3.eth.defaultAccount = owner.address;
const externalUser = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f';

describe('Faucet', () => {
  beforeEach(async () => {
    const tokenContract = new web3.eth.Contract(HMToken.abi);
    token = await (tokenContract.deploy as any)({
      data: HMToken.bytecode,
      arguments: [
        web3.utils.toWei('100000', 'ether'),
        'Human Token',
        18,
        'HMT',
      ],
    }).send({
      from: owner.address,
    });
  });

  it('Check faucet balance before send', async () => {
    const result = await getFaucetBalance(web3, token.options.address);

    expect(result).toBe(web3.utils.toWei('100000', 'ether'));
  });

  it('Check HMT balance', async () => {
    const result = await getHmtBalance(web3, token.options.address);

    expect(result).toBe(100000000000000000000000000000000000000000n);
  });

  it('Send balance', async () => {
    const oldFaucetBalance = await getFaucetBalance(
      web3,
      token.options.address
    );
    const oldUserBalance = await (token.methods.balanceOf as any)(
      externalUser
    ).call();

    await sendFunds(web3, token.options.address, externalUser);

    const newFaucetBalance = await getFaucetBalance(
      web3,
      token.options.address
    );
    const newUserBalance = await (token.methods.balanceOf as any)(
      externalUser
    ).call();

    expect(Number(newFaucetBalance)).toBe(Number(oldFaucetBalance) - 10);
    expect(oldUserBalance).toBe(
      web3.utils.toBigInt(newUserBalance) -
        web3.utils.toBigInt(web3.utils.toWei('10', 'ether'))
    );
  });

  it('Check balance', async () => {
    expect(await checkFaucetBalance(web3, token.options.address)).toBeTruthy();

    await (token.methods.transfer as any)(
      externalUser,
      await (token.methods.balanceOf as any)(owner.address).call()
    ).send({ from: owner.address });

    expect(await checkFaucetBalance(web3, token.options.address)).toBeFalsy();
  });

  it('Check min balance threshold for ERC20 token', async () => {
    const oldFaucetBalance = await getFaucetBalance(
      web3,
      token.options.address
    );
    const oldUserBalance = await (token.methods.balanceOf as any)(
      externalUser
    ).call();

    await sendFunds(web3, token.options.address, externalUser);

    const newFaucetBalance = await getFaucetBalance(
      web3,
      token.options.address
    );
    const newUserBalance = await (token.methods.balanceOf as any)(
      externalUser
    ).call();

    expect(Number(newFaucetBalance)).toBe(Number(oldFaucetBalance) - 10);
    expect(oldUserBalance).toBe(
      web3.utils.toBigInt(newUserBalance) -
        web3.utils.toBigInt(web3.utils.toWei('10', 'ether'))
    );
  });
});
