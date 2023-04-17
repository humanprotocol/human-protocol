import Proxy from '@human-protocol/core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json';
import HMToken from '@human-protocol/core/artifacts/contracts/HMToken.sol//HMToken.json';
import Reputation from '@human-protocol/core/artifacts/contracts/Reputation.sol/Reputation.json';
import Staking from '@human-protocol/core/artifacts/contracts/Staking.sol/Staking.json';
import { beforeAll, describe, expect, it } from '@jest/globals';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import {
  updateReputations,
  calculateRewardForWorker,
  getReputations,
} from './reputation';

let token: Contract;
let staking: Contract;
let reputation: Contract;

const worker1 = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f';
const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';
const worker3 = '0x146D35a6485DbAFF357fB48B3BbA31fCF9E9c787';

const web3 = new Web3('http://127.0.0.1:8548');
const owner = web3.eth.accounts.privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
);
const reputationAccount = web3.eth.accounts.privateKeyToAccount(
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
);

const reputations = [
  { workerAddress: worker1, reputation: 10 },
  { workerAddress: worker2, reputation: -10 },
  { workerAddress: worker3, reputation: 20 },
];

describe('Reputation', () => {
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

    const proxyContract = new web3.eth.Contract(Proxy.abi as []);

    const stakingContract = new web3.eth.Contract(Staking.abi as []);
    const stakingIml = await stakingContract
      .deploy({
        data: Staking.bytecode,
        arguments: [],
      })
      .send({
        from: owner.address,
      });
    const stakingProxy = await proxyContract
      .deploy({
        data: Proxy.bytecode,
        arguments: [
          stakingIml.options.address,
          stakingContract.methods
            .initialize(
              token.options.address,
              web3.utils.toWei('1', 'ether'),
              1
            )
            .encodeABI(),
        ],
      })
      .send({
        from: owner.address,
      });
    staking = new web3.eth.Contract(
      Staking.abi as [],
      stakingProxy.options.address
    );
  });

  beforeEach(async () => {
    const proxyContract = new web3.eth.Contract(Proxy.abi as []);

    const reputationContract = new web3.eth.Contract(Reputation.abi as []);
    const reputationImpl = await reputationContract
      .deploy({
        data: Reputation.bytecode,
        arguments: [],
      })
      .send({
        from: owner.address,
      });

    const reputationProxy = await proxyContract
      .deploy({
        data: Proxy.bytecode,
        arguments: [
          reputationImpl.options.address,
          reputationContract.methods
            .initialize(staking.options.address, 1)
            .encodeABI(),
        ],
      })
      .send({
        from: owner.address,
      });
    reputation = new web3.eth.Contract(
      Reputation.abi as [],
      reputationProxy.options.address
    );

    await token.methods
      .transfer(reputationAccount.address, web3.utils.toWei('1000', 'ether'))
      .send({ from: owner.address });

    await token.methods
      .approve(staking.options.address, web3.utils.toWei('500', 'ether'))
      .send({ from: reputationAccount.address });

    await staking.methods
      .stake(web3.utils.toWei('500', 'ether'))
      .send({ from: reputationAccount.address });

    web3.eth.defaultAccount = reputationAccount.address;
  });

  it('Get reputations', async () => {
    const result = await getReputations(web3, reputation.options.address, [
      worker1,
      worker2,
      worker3,
    ]);

    expect(result).not.toBeUndefined();
    expect(result[0].reputation).toBe('0');
    expect(result[1].reputation).toBe('0');
    expect(result[2].reputation).toBe('0');
  });

  it('Add reputations', async () => {
    await updateReputations(web3, reputation.options.address, reputations);

    const result = await getReputations(web3, reputation.options.address, [
      worker1,
      worker2,
      worker3,
    ]);

    expect(result).not.toBeUndefined();
    expect(result[0].reputation).toBe('60');
    expect(result[1].reputation).toBe('40');
    expect(result[2].reputation).toBe('70');
  });

  it('Calculate rewards', async () => {
    await updateReputations(web3, reputation.options.address, reputations);

    const result = await calculateRewardForWorker(
      web3,
      reputation.options.address,
      '3000000',
      [worker1, worker2, worker3]
    );

    expect(result).toStrictEqual(['1058823', '705882', '1235294']);
  });
});
