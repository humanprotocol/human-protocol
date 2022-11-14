const Web3 = require('web3');
const escrowAbi = require('@human-protocol/core/abis/Escrow.json');
const invalidEscrowAbi = require('./contracts/InvalidEscrowAbi.json');
const {
  createEscrowFactory,
  createEscrow,
  fundEscrow,
  setupEscrow,
  setupAgents,
  sendFortune,
} = require('./fixtures');
const { urls, statusesMap, escrowFundAmount } = require('./constants');
const web3 = new Web3(urls.ethHTTPServer);

describe('Invalid escrow', () => {
  test('Invalid escrow setup', async () => {
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

    // Bad repOracle address
    let res = await setupEscrow(lastEscrowAddr, 'BadAdress');
    expect(res.value).toBe('BadAdress');

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Launched');

    // Bad recOracle address
    res = await setupEscrow(lastEscrowAddr, 'BadAdress');
    expect(res.value).toBe('BadAdress');

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Launched');

    // Bad repOracle stake
    res = await setupEscrow(lastEscrowAddr, 110);
    expect(res.value).toBe(110);

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Launched');

    // Bad recOracle stake
    res = await setupEscrow(lastEscrowAddr, 110);
    expect(res.value).toBe(110);

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Launched');
  });

  test('Invalid escrow ABI', async () => {
    const escrowFactory = createEscrowFactory();
    await createEscrow(escrowFactory);

    const lastEscrowAddr = await escrowFactory.methods.lastEscrow().call();
    // Create an escrow with ABI not matches actual ABI
    const Escrow = new web3.eth.Contract(invalidEscrowAbi, lastEscrowAddr);
    let escrowSt = await Escrow.methods.status().call();

    expect(statusesMap[escrowSt]).toBe('Launched');
    expect(lastEscrowAddr).not.toBe(
      '0x0000000000000000000000000000000000000000'
    );

    await fundEscrow(lastEscrowAddr);
    let res = await setupEscrow(lastEscrowAddr, Escrow);
    expect(res.code).toBe('INVALID_ARGUMENT');

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Launched');
  });

  test('Invalid fortunes', async () => {
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

    const agentAddresses = await setupAgents();

    await setupEscrow(lastEscrowAddr);
    // Send fortune to the escrow not in Pending state
    let res = await sendFortune(agentAddresses[0]);
    expect(res.status).toBe(400);

    escrowSt = await Escrow.methods.status().call();
    expect(statusesMap[escrowSt]).toBe('Pending');

    const escrowBalance = await Escrow.methods.getBalance().call();
    const value = web3.utils.toWei(`${escrowFundAmount}`, 'ether');
    expect(escrowBalance).toBe(value);

    // Send fortune with an invalid escrow address to the recording oracle
    res = await sendFortune(agentAddresses[0], 'Invalid Address');
    expect(res.status).toBe(400);

    // Send an empty fortuneto the recording oracle
    res = await sendFortune(agentAddresses[0], '');
    expect(res.status).toBe(400);

    // Send a fortune twice from one account to the recording oracle
    res = await sendFortune(agentAddresses[0], lastEscrowAddr);
    expect(res.status).toBe(201);

    res = await sendFortune(agentAddresses[0], lastEscrowAddr);
    expect(res.status).toBe(400);
  });
});
