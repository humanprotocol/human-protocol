const Web3 = require('web3');
const { filterAddressesToReward } = require('./rewards');

const worker1 = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';
const worker3 = '0x146D35a6485DbAFF357fB48B3BbA31fCF9E9c787';

describe('Rewards', () => {
  it('Filter duplicated fortune', async () => {
    const result = filterAddressesToReward(new Web3(), [
      { worker: worker1, fortune: 'fortune' },
      { worker: worker2, fortune: 'fortune' },
      { worker: worker3, fortune: 'fortune1' },
    ]);

    expect(result.workerAddresses).toStrictEqual([worker1, worker3]);
  });

  it('Check fortune bad words', async () => {
    const result = filterAddressesToReward(new Web3(), [
      { worker: worker1, fortune: 'damn' },
      { worker: worker2, fortune: 'fortune' },
      { worker: worker3, fortune: 'shit should be blocked' },
    ]);
    expect(result.workerAddresses).toStrictEqual([worker2]);
    expect(result.reputationValues[0].reputation).toStrictEqual(-1);
    expect(result.reputationValues[2].reputation).toStrictEqual(-1);
  });
});
