import Web3 from 'web3';
import { getBalance, bulkPayOut, bulkPaid } from './escrow';
import { describe, expect, it, beforeAll, beforeEach } from '@jest/globals';
import Escrow from '@human-protocol/core/artifacts/contracts/Escrow.sol/Escrow.json';
import HMToken from '@human-protocol/core/artifacts/contracts/HMToken.sol//HMToken.json';
import EscrowFactory from '@human-protocol/core/artifacts/contracts/EscrowFactory.sol/EscrowFactory.json';
import Staking from '@human-protocol/core/artifacts/contracts/Staking.sol/Staking.json';
import { Contract } from 'web3-eth-contract';

let token: Contract;
let staking: Contract;
let escrowFactory: Contract;
let escrowAddress: string;
let escrow: Contract;

const worker1 = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f';
const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';
const worker3 = '0x146D35a6485DbAFF357fB48B3BbA31fCF9E9c787';

const web3 = new Web3('http://127.0.0.1:8548');
const owner = web3.eth.accounts.privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
);
const launcher = web3.eth.accounts.privateKeyToAccount(
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
);
const recordingAccount = web3.eth.accounts.privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
);
web3.eth.defaultAccount = recordingAccount.address;

describe('Fortune', () => {
  beforeAll(async () => {
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

    const stakingContract = new web3.eth.Contract(Staking.abi as []);
    staking = await stakingContract
      .deploy({
        data: Staking.bytecode,
        arguments: [token.options.address, web3.utils.toWei('1', 'ether'), 1],
      })
      .send({
        from: owner.address,
      });

    const escrowFactoryContract = new web3.eth.Contract(
      EscrowFactory.abi as []
    );
    escrowFactory = await escrowFactoryContract
      .deploy({
        data: EscrowFactory.bytecode,
        arguments: [token.options.address, staking.options.address],
      })
      .send({
        from: owner.address,
      });

    await token.methods
      .transfer(launcher.address, web3.utils.toWei('1000', 'ether'))
      .send({ from: owner.address });

    await token.methods
      .approve(staking.options.address, web3.utils.toWei('500', 'ether'))
      .send({ from: launcher.address });

    await staking.methods
      .stake(web3.utils.toWei('500', 'ether'))
      .send({ from: launcher.address });
  });

  beforeEach(async () => {
    await escrowFactory.methods
      .createEscrow([launcher.address])
      .send({ from: launcher.address });

    escrowAddress = await escrowFactory.methods.lastEscrow().call();

    const value = web3.utils.toWei('30', 'ether');
    await token.methods
      .transfer(escrowAddress, value)
      .send({ from: launcher.address });

    escrow = new web3.eth.Contract(Escrow.abi as [], escrowAddress);
    await escrow.methods
      .setup(
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        10,
        10,
        'manifestUrl',
        'manifestUrl'
      )
      .send({ from: launcher.address });
  });

  it('Get escrow balance', async () => {
    const balance = await getBalance(web3, escrowAddress);
    expect(balance).toBe(30000000000000000000);
  });

  it('Bulk payout rewards, higher amount than balance', async () => {
    await bulkPayOut(
      web3,
      escrowAddress,
      [worker1, worker2, worker3],
      [
        web3.utils.toWei('15', 'ether'),
        web3.utils.toWei('15', 'ether'),
        web3.utils.toWei('15', 'ether'),
      ],
      'localhost',
      'localhost'
    );
    const result = await bulkPaid(web3, escrowAddress);

    expect(result).toBe(false);
    expect(await token.methods.balanceOf(worker1).call()).toBe(
      web3.utils.toWei('0', 'ether')
    );
    expect(await token.methods.balanceOf(worker2).call()).toBe(
      web3.utils.toWei('0', 'ether')
    );
    expect(await token.methods.balanceOf(worker3).call()).toBe(
      web3.utils.toWei('0', 'ether')
    );
  }, 10000);

  it('Bulk payout rewards', async () => {
    await bulkPayOut(
      web3,
      escrowAddress,
      [worker1, worker2, worker3],
      [
        web3.utils.toWei('10', 'ether'),
        web3.utils.toWei('10', 'ether'),
        web3.utils.toWei('10', 'ether'),
      ],
      'localhost',
      'localhost'
    );
    const result = await bulkPaid(web3, escrowAddress);

    expect(result).toBe(true);
    expect(await token.methods.balanceOf(worker1).call()).toBe(
      web3.utils.toWei('8', 'ether')
    );
    expect(await token.methods.balanceOf(worker2).call()).toBe(
      web3.utils.toWei('8', 'ether')
    );
    expect(await token.methods.balanceOf(worker3).call()).toBe(
      web3.utils.toWei('8', 'ether')
    );
  }, 10000);
});
