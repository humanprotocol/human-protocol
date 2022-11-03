const Web3 = require('web3');
const escrowFile = require('./build/contracts/Escrow.json');
const hmtokenFile = require('./build/contracts/HMToken.json');
const { createEscrowFactory, createEscrow, fundEscrow, setupEscrow, setupAgents, sendFortune, calculateRewardAmount } = require('./fixtures');
const { urls, statusesMap, addresses, escrowFundAmount } = require('./constants');
const web3 = new Web3(urls.ethHTTPServer);
const escrowAbi = escrowFile.abi;
const hmtokenAbi = hmtokenFile.abi;

describe('Positive flow + adding same fortune. Only one unique fortune teller should be rewarded.', () => {
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

        const escrowBalance = await Escrow.methods.getBalance().call();
        const value = web3.utils.toWei(`${escrowFundAmount}`, 'ether');
        expect(escrowBalance).toBe(value);

        const agentAddresses = await setupAgents();

        const Token = new web3.eth.Contract(hmtokenAbi, addresses.hmt);
        const reputationOracleOldBalance = await Token.methods.balanceOf(addresses.repOracle).call();
        const recordingOracleOldBalance = await Token.methods.balanceOf(addresses.recOracle).call();

        const testFortune = 'Same for everyone';
        const agent_1_res = await sendFortune(agentAddresses.agent_1, lastEscrowAddr, testFortune);
        expect(agent_1_res.status).toBe(201);

        const agent_2_res = await sendFortune(agentAddresses.agent_2, lastEscrowAddr, testFortune);
        expect(agent_2_res.status).toBe(201);

        const agent_3_res = await sendFortune(agentAddresses.agent_3, lastEscrowAddr, testFortune);
        expect(agent_3_res.status).toBe(201);

        escrowSt = await Escrow.methods.status().call();
        expect(statusesMap[escrowSt]).toBe('Paid');

        const rewards = await calculateRewardAmount();

        const agent_1_balance = await Token.methods.balanceOf(agentAddresses.agent_1).call();
        expect(agent_1_balance).toBe(`${value - rewards.totalRecOracleReward - rewards.totalRepOracleReward}`);
        const agent_2_balance = await Token.methods.balanceOf(agentAddresses.agent_2).call();
        expect(agent_2_balance).toBe('0');
        const agent_3_balance = await Token.methods.balanceOf(agentAddresses.agent_3).call();
        expect(agent_3_balance).toBe('0');
        const reputationOracleBalance = await Token.methods.balanceOf(addresses.repOracle).call();
        expect(reputationOracleBalance - reputationOracleOldBalance).toBe(rewards.totalRepOracleReward);
        const recordingOracleBalance = await Token.methods.balanceOf(addresses.recOracle).call();
        expect(recordingOracleBalance - recordingOracleOldBalance).toBe(rewards.totalRecOracleReward);
    });
});