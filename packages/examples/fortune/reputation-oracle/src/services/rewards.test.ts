const Web3 = require('web3');
const { filterAddressesToReward } = require('./rewards');

const worker1 = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const worker2 = '0xcd3B766CCDd6AE721141F452C550Ca635964ce71';
const worker3 = '0x146D35a6485DbAFF357fB48B3BbA31fCF9E9c787';
const recOracle = '0x634316ea0ee79c701c6f67c53a4c54cbafd2316d';
const fortunes = {};

describe('Rewards', () => {
  it('Filter duplicated fortune', async () => {
    fortunes[worker1] = [
      {
        score: true,
        fortune: 'fortune',
      },
    ];
    fortunes[worker2] = [
      {
        score: false,
        fortune: 'fortune',
      },
    ];
    fortunes[worker3] = [
      {
        score: true,
        fortune: 'fortune1',
      },
    ];
    const result = filterAddressesToReward(new Web3(), fortunes, recOracle);

    expect(result.workerAddresses).toStrictEqual([worker1, worker3]);
  });

  it('Check fortune bad words', async () => {
    fortunes[worker1] = [
      {
        score: false,
        fortune: 'damn',
      },
    ];
    fortunes[worker2] = [
      {
        score: false,
        fortune: 'shit',
      },
      {
        score: true,
        fortune: 'fortune',
      },
    ];
    fortunes[worker3] = [
      {
        score: false,
        fortune: 'shit should be blocked',
      },
    ];
    const result = filterAddressesToReward(new Web3(), fortunes, recOracle);
    expect(result.workerAddresses).toStrictEqual([worker2]);
    expect(result.reputationValues[0].reputation).toStrictEqual(-1);
    expect(result.reputationValues[1].reputation).toStrictEqual(-1);
    expect(result.reputationValues[2].reputation).toStrictEqual(1);
    expect(result.reputationValues[3].reputation).toStrictEqual(-1);
    expect(result.reputationValues[4].workerAddress).toStrictEqual(recOracle);
    expect(result.reputationValues[4].reputation).toStrictEqual(1);
  });

  it('Check recording oracle reputation', async () => {
    fortunes[worker1] = [
      {
        score: true,
        fortune: 'fortune',
      },
    ];
    fortunes[worker2] = [
      {
        score: false,
        fortune: 'fortune',
      },
    ];
    fortunes[worker3] = [
      {
        score: false,
        fortune: 'shit should be blocked',
      },
    ];
    let result = filterAddressesToReward(new Web3(), fortunes, recOracle);
    expect(result.reputationValues[0].reputation).toStrictEqual(1);
    expect(result.reputationValues[1].reputation).toStrictEqual(-1);
    expect(result.reputationValues[2].reputation).toStrictEqual(-1);
    expect(result.reputationValues[3].workerAddress).toStrictEqual(recOracle);
    expect(result.reputationValues[3].reputation).toStrictEqual(1);

    fortunes[worker1] = [
      {
        score: true,
        fortune: 'fortune',
      },
    ];
    fortunes[worker2] = [
      {
        score: false,
        fortune: 'fortune',
      },
    ];
    fortunes[worker3] = [
      {
        score: true,
        fortune: 'shit should be blocked',
      },
    ];
    result = filterAddressesToReward(new Web3(), fortunes, recOracle);
    expect(result.reputationValues[0].reputation).toStrictEqual(1);
    expect(result.reputationValues[1].reputation).toStrictEqual(-1);
    expect(result.reputationValues[2].reputation).toStrictEqual(-1);
    expect(result.reputationValues[3].reputation).toStrictEqual(-1);

    fortunes[worker1] = [
      {
        score: false,
        fortune: 'fortune',
      },
    ];
    fortunes[worker2] = [
      {
        score: false,
        fortune: 'fortune',
      },
    ];
    fortunes[worker3] = [
      {
        score: false,
        fortune: 'shit should be blocked',
      },
    ];
    result = filterAddressesToReward(new Web3(), fortunes, recOracle);
    expect(result.reputationValues[0].reputation).toStrictEqual(1);
    expect(result.reputationValues[1].reputation).toStrictEqual(-1);
    expect(result.reputationValues[2].reputation).toStrictEqual(-1);
    expect(result.reputationValues[3].reputation).toStrictEqual(-1);
  });
});
