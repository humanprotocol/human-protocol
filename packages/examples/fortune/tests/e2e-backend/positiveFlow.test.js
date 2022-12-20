const Web3 = require('web3');
const escrowAbi = require('@human-protocol/core/abis/Escrow.json');
const hmtokenAbi = require('@human-protocol/core/abis/HMToken.json');
const {
  createEscrowFactory,
  createEscrow,
  fundEscrow,
  setupEscrow,
  setupAgents,
  sendFortune,
  calculateRewardAmount,
  getS3File,
} = require('./fixtures');
const {
  urls,
  statusesMap,
  addresses,
  escrowFundAmount,
} = require('./constants');
const web3 = new Web3(urls.ethHTTPServer);

describe('Positive flow', () => {
  test('Flow', async () => {
    const escrowFactory = createEscrowFactory();
    await createEscrow(escrowFactory);
    const lastEscrowAddr = await escrowFactory.methods.lastEscrow().call();
    const Escrow = new web3.eth.Contract(escrowAbi, lastEscrowAddr);
    let escrowSt = await Escrow.methods.status().call();

    expect(statusesMap[escrowSt]).toBe('Launched');
    expect(lastEscrowAddr).not.toBe(
      '0x0000000000000000000000000000000000000000'
    );

    await fundEscrow(lastEscrowAddr);
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
    for (let i = 0; i < agentAddresses.length; i++) {
      agentsOldBalances[i] = await Token.methods
        .balanceOf(agentAddresses[i])
        .call();
      const agent_res = await sendFortune(agentAddresses[i], lastEscrowAddr);
      expect(agent_res.status).toBe(201);
    }

    await expect(getS3File(lastEscrowAddr)).resolves.not.toBeNull();
    const events = await Escrow.getPastEvents('IntermediateStorage', {
      fromBlock: 0,
      toBlock: 'latest',
    });
    expect(events.length).toBe(agentAddresses.length);

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Paid');

    const rewards = await calculateRewardAmount();
    for (let i = 0; i < agentAddresses.length; i++) {
      const agent_balance = await Token.methods
        .balanceOf(agentAddresses[i])
        .call();
      expect(agent_balance - agentsOldBalances[i]).toBe(
        rewards.totalWorkerReward
      );
    }

    const reputationOracleBalance = await Token.methods
      .balanceOf(addresses.repOracle)
      .call();
    expect(reputationOracleBalance - reputationOracleOldBalance).toBe(
      rewards.totalRepOracleReward
    );
    const recordingOracleBalance = await Token.methods
      .balanceOf(addresses.recOracle)
      .call();
    expect(recordingOracleBalance - recordingOracleOldBalance).toBe(
      rewards.totalRecOracleReward
    );
  });
});
