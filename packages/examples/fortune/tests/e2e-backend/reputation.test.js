const Web3 = require('web3');
const reputationAbi = require('./contracts/ReputationAbi.json');
const { urls, addresses } = require('./constants');
const web3 = new Web3(urls.ethHTTPServer);

describe('Reputation', () => {
  let reputationContract;

  beforeAll(() => {
    reputationContract = new web3.eth.Contract(
      reputationAbi,
      addresses.reputation
    );
  });

  test('Add reputation', async () => {
    const account = (await web3.eth.getAccounts())[0];
    const account1 = (await web3.eth.getAccounts())[1];

    const oldReputations = await reputationContract.methods
      .getReputations([account, account1])
      .call();

    await reputationContract.methods
      .addReputations([
        [account, 2],
        [account1, -1],
      ])
      .send({ from: addresses.repOracle });

    const newReputations = await reputationContract.methods
      .getReputations([account, account1])
      .call();
    expect(Number(newReputations[0].reputation)).toBe(
      (Number(oldReputations[0].reputation) || 50) + 2
    );
    expect(Number(newReputations[1].reputation)).toBe(
      (Number(oldReputations[1].reputation) || 50) - 1
    );
  });

  test('Check reputation limits', async () => {
    const account = (await web3.eth.getAccounts())[2];
    const account1 = (await web3.eth.getAccounts())[3];

    const oldReputations = await reputationContract.methods
      .getReputations([account, account1])
      .call();

    await reputationContract.methods
      .addReputations([
        [account, 80],
        [account1, -80],
      ])
      .send({ from: addresses.repOracle });

    const newReputations = await reputationContract.methods
      .getReputations([account, account1])
      .call();
    expect(Number(newReputations[0].reputation)).toBe(100);
    expect(Number(newReputations[1].reputation)).toBe(1);
  });

  test('Check rewards', async () => {
    const account = (await web3.eth.getAccounts())[0];
    const account1 = (await web3.eth.getAccounts())[1];

    const oldReputations = await reputationContract.methods
      .getReputations([account, account1])
      .call();
    let total = oldReputations.reduce((a, b) => a + Number(b.reputation), 0);

    const oldRewards = await reputationContract.methods
      .getRewards(web3.utils.toWei('1', 'ether'), [account, account1])
      .call();

    expect(Number(oldRewards[0])).toBe(
      (web3.utils.toWei('1', 'ether') * Number(oldReputations[0].reputation)) /
        total
    );
    expect(Number(oldRewards[1])).toBe(
      (web3.utils.toWei('1', 'ether') * Number(oldReputations[1].reputation)) /
        total
    );

    await reputationContract.methods
      .addReputations([
        [account, 2],
        [account1, -1],
      ])
      .send({ from: addresses.repOracle });

    const newRewards = await reputationContract.methods
      .getRewards(web3.utils.toWei('1', 'ether'), [account, account1])
      .call();

    const newReputations = await reputationContract.methods
      .getReputations([account, account1])
      .call();

    expect(Number(newRewards[0])).toBe(
      (web3.utils.toWei('1', 'ether') * Number(newReputations[0].reputation)) /
        (total + 1)
    );
    expect(Number(newRewards[1])).toBe(
      (web3.utils.toWei('1', 'ether') * Number(newReputations[1].reputation)) /
        (total + 1)
    );
    expect(Number(newRewards[0])).not.toBe(Number(oldRewards[0]));
    expect(Number(newRewards[1])).not.toBe(Number(oldRewards[0]));
  });

  test('Check user not allowed', async () => {
    const account = (await web3.eth.getAccounts())[0];
    const account1 = (await web3.eth.getAccounts())[1];
    let error = null;
    try {
      await reputationContract.methods
        .addReputations([
          [account, 2],
          [account1, -1],
        ])
        .send({ from: account });
    } catch (err) {
      error = err;
    }
    expect(error).not.toBe(null);
  });
});
