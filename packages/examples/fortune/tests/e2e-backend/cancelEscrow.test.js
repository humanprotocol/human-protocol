const Web3 = require('web3');
const escrowFile = require('./build/contracts/Escrow.json');
const hmtokenFile = require('./build/contracts/HMToken.json');
const { createEscrowFactory, createEscrow, fundEscrow, setupEscrow, setupAgents, sendFortune, calculateRewardAmount } = require('./fixtures');
const { urls, statusesMap, addresses, escrowFundAmount } = require('./constants');
const web3 = new Web3(urls.ethHTTPServer);
const escrowAbi = escrowFile.abi;
const hmtokenAbi = hmtokenFile.abi;

describe('Cancel escrow', () => {
    test('Flow', async () => {
        const escrowFactory = createEscrowFactory();
        await createEscrow(escrowFactory);

        const lastEscrowAddr = await escrowFactory.methods.lastEscrow().call();
        const Escrow = new web3.eth.Contract(escrowAbi, lastEscrowAddr);
        let escrowSt = await Escrow.methods.status().call();

        expect(statusesMap[escrowSt]).toBe('Launched');
        expect(lastEscrowAddr).not.toBe('0x0000000000000000000000000000000000000000');

        await fundEscrow(lastEscrowAddr);
        await setupEscrow(lastEscrowAddr);

        escrowSt = await Escrow.methods.status().call();
        expect(statusesMap[escrowSt]).toBe('Pending');

        let escrowBalance = await Escrow.methods.getBalance().call();
        const value = web3.utils.toWei(`${escrowFundAmount}`, 'ether');
        expect(escrowBalance).toBe(value);

        const agentAddresses = await setupAgents();

        const agent_1_res = await sendFortune(agentAddresses.agent_1, lastEscrowAddr);
        expect(agent_1_res.status).toBe(201);

        const Token = new web3.eth.Contract(hmtokenAbi, addresses.hmt);
        const account = (await web3.eth.getAccounts())[0];
        const cancellerBalance = BigInt(await Token.methods.balanceOf(account).call());
        const res = await Escrow.methods.cancel().send({ from: account });
        expect(res.status).toBe(true);

        escrowSt = await Escrow.methods.status().call();
        expect(statusesMap[escrowSt]).toBe('Cancelled');

        escrowBalance = await Escrow.methods.getBalance().call();
        expect(escrowBalance).toBe('0');

        const newCancellerBalance = BigInt(await Token.methods.balanceOf(account).call());
        expect(newCancellerBalance - cancellerBalance).toBe(BigInt(value));
        const reputationOracleOldBalance = await Token.methods.balanceOf(addresses.repOracle).call();
        const recordingOracleOldBalance = await Token.methods.balanceOf(addresses.recOracle).call();

        const agent_1_balance = await Token.methods.balanceOf(agentAddresses.agent_1).call();
        expect(agent_1_balance).toBe(`0`);
        const reputationOracleBalance = await Token.methods.balanceOf(addresses.repOracle).call();
        expect(reputationOracleBalance - reputationOracleOldBalance).toBe(0);
        const recordingOracleBalance = await Token.methods.balanceOf(addresses.recOracle).call();
        expect(recordingOracleBalance - recordingOracleOldBalance).toBe(0);
    });
});