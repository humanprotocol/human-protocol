const Web3 = require('web3');
const escrowAbi = require('@human-protocol/core/abis/Escrow.json');
const hmtokenAbi = require('@human-protocol/core/abis/HMToken.json');
const {
  createEscrowFactory,
  createEscrow,
  fundAccountHMT,
  setupEscrow,
  setupAgents,
  sendFortune,
  calculateRewardAmount,
  stake,
  setupAccounts,
} = require('./fixtures');
const {
  urls,
  statusesMap,
  addresses,
  escrowFundAmount,
} = require('./constants');
const web3 = new Web3(urls.ethHTTPServer);

describe('Positive flow + adding same fortune. Only one unique fortune teller should be rewarded.', () => {
  beforeAll(async () => {
    await setupAccounts();
  });

  test('Flow', async () => {
    const escrowFactory = createEscrowFactory();
    await stake(escrowFactory);
    await createEscrow(escrowFactory);

    const lastEscrowAddr = await escrowFactory.methods.lastEscrow().call();
    const Escrow = new web3.eth.Contract(escrowAbi, lastEscrowAddr);
    let escrowSt = await Escrow.methods.status().call();

    expect(statusesMap[escrowSt]).toBe('Launched');
    expect(lastEscrowAddr).not.toBe(
      '0x0000000000000000000000000000000000000000'
    );

    await fundAccountHMT(lastEscrowAddr);
    await setupEscrow(lastEscrowAddr);

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Pending');

    const escrowBalance = await Escrow.methods.getBalance().call();
    const value = web3.utils.toWei(`${escrowFundAmount}`, 'ether');
    expect(escrowBalance).toBe(value);

    const agentAddresses = await setupAgents();

    const Token = new web3.eth.Contract(hmtokenAbi, addresses.hmt);
    const reputationOracleOldBalance = await Token.methods
      .balanceOf(addresses.repOracle)
      .call();
    const recordingOracleOldBalance = await Token.methods
      .balanceOf(addresses.recOracle)
      .call();

    const agentsOldBalances = [];
    const testFortune = 'Same for everyone';
    for (let i = 0; i < agentAddresses.length; i++) {
      agentsOldBalances[i] = await Token.methods
        .balanceOf(agentAddresses[i])
        .call();
      const agent_res = await sendFortune(
        agentAddresses[i],
        lastEscrowAddr,
        testFortune
      );
      expect(agent_res.status).toBe(201);
    }

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Paid');

    const rewards = await calculateRewardAmount([agentAddresses[0]]);

    const agent_1_balance = await Token.methods
      .balanceOf(agentAddresses[0])
      .call();
    expect(
      web3.utils
        .toBN(agent_1_balance)
        .sub(web3.utils.toBN(agentsOldBalances[0]))
        .toString()
    ).toBe(
      web3.utils
        .toBN(value)
        .sub(rewards.totalRecOracleReward)
        .sub(rewards.totalRepOracleReward)
        .toString()
    );
    for (let i = 1; i < agentAddresses.length; i++) {
      const agent_balance = await Token.methods
        .balanceOf(agentAddresses[i])
        .call();
      expect(agent_balance).toBe(agentsOldBalances[i]);
    }

    const reputationOracleBalance = await Token.methods
      .balanceOf(addresses.repOracle)
      .call();
    expect(
      web3.utils
        .toBN(reputationOracleBalance)
        .sub(web3.utils.toBN(reputationOracleOldBalance))
        .toString()
    ).toBe(rewards.totalRepOracleReward.toString());
    const recordingOracleBalance = await Token.methods
      .balanceOf(addresses.recOracle)
      .call();
    expect(
      web3.utils
        .toBN(recordingOracleBalance)
        .sub(web3.utils.toBN(recordingOracleOldBalance))
        .toString()
    ).toBe(rewards.totalRecOracleReward.toString());
  });
});
