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
let launcher;

describe('Cancel escrow', () => {
  beforeAll(async () => {
    [, launcher] = await setupAccounts();
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

    let escrowBalance = await Escrow.methods.getBalance().call();
    const value = web3.utils.toWei(`${escrowFundAmount}`, 'ether');
    expect(escrowBalance).toBe(value);

    const agentAddresses = await setupAgents();

    const Token = new web3.eth.Contract(hmtokenAbi, addresses.hmt);

    const agentOldBalance = await Token.methods
      .balanceOf(agentAddresses[0])
      .call();
    const agent_1_res = await sendFortune(agentAddresses[0], lastEscrowAddr);
    expect(agent_1_res.status).toBe(201);

    const cancellerBalance = BigInt(
      await Token.methods.balanceOf(launcher).call()
    );
    const res = await Escrow.methods.cancel().send({ from: launcher });
    expect(res.status).toBe(true);

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Cancelled');

    escrowBalance = await Escrow.methods.getBalance().call();
    expect(escrowBalance).toBe('0');

    const newCancellerBalance = BigInt(
      await Token.methods.balanceOf(launcher).call()
    );
    expect(newCancellerBalance - cancellerBalance).toBe(BigInt(value));
    const reputationOracleOldBalance = await Token.methods
      .balanceOf(addresses.repOracle)
      .call();
    const recordingOracleOldBalance = await Token.methods
      .balanceOf(addresses.recOracle)
      .call();

    const agent_1_balance = await Token.methods
      .balanceOf(agentAddresses[0])
      .call();
    expect(agent_1_balance).toBe(agentOldBalance);
    const reputationOracleBalance = await Token.methods
      .balanceOf(addresses.repOracle)
      .call();
    expect(reputationOracleBalance - reputationOracleOldBalance).toBe(0);
    const recordingOracleBalance = await Token.methods
      .balanceOf(addresses.recOracle)
      .call();
    expect(recordingOracleBalance - recordingOracleOldBalance).toBe(0);
  });
});
