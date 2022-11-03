const Web3 = require('web3');
const { filterAddressesToReward, calculateRewardForWorker } = require('./rewards');
const {
  describe, expect, it,
} = require('@jest/globals');

const worker1 = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';
const worker3 = '0x146D35a6485DbAFF357fB48B3BbA31fCF9E9c787';

describe('Rewards', () => {
  it('Filter duplicated fortune', async () => {
    const result = filterAddressesToReward(
      new Web3(),
      [
        { worker: worker1, fortune: 'fortune' },
        { worker: worker2, fortune: 'fortune' },
        { worker: worker3, fortune: 'fortune1' },
      ],
    );
    expect(result).toStrictEqual([worker1, worker3]);
  });

  it('Calculate rewards', async () => {
    const result = calculateRewardForWorker(
      30,
      [worker1, worker2, worker3],
    );
    expect(result).toStrictEqual(['10', '10', '10']);
  });
});
