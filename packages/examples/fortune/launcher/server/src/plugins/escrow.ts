import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import EscrowFactoryAbi from '@human-protocol/core/abis/EscrowFactory.json' assert { type: "json" };
import HMTokenAbi from '@human-protocol/core/abis/HMToken.json' assert { type: "json" };
import EscrowAbi from '@human-protocol/core/abis/Escrow.json' assert { type: "json" };
import { escrow as escrowSchema } from '../schemas/escrow.js';
import Web3 from 'web3';
import { REC_ORACLE_ADDRESS, REC_ORACLE_PERCENTAGE_FEE, REP_ORACLE_ADDRESS, REP_ORACLE_PERCENTAGE_FEE } from "../constants/oracles.js";

class Escrow {
    async setupEscrow (web3: Web3, escrowAddress: string, url: string, fortunesRequested: number) {
        const escrowContract = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
        const gas = await escrowContract.methods
            .setup(REP_ORACLE_ADDRESS, REC_ORACLE_ADDRESS, REP_ORACLE_PERCENTAGE_FEE, REC_ORACLE_PERCENTAGE_FEE, url, url, fortunesRequested)
            .estimateGas({ from: web3.eth.defaultAccount });
        const gasPrice = await web3.eth.getGasPrice();
        const result = await escrowContract.methods
            .setup(REP_ORACLE_ADDRESS, REC_ORACLE_ADDRESS, REP_ORACLE_PERCENTAGE_FEE, REC_ORACLE_PERCENTAGE_FEE, url, url, fortunesRequested)
            .send({ from: web3.eth.defaultAccount, gas, gasPrice });
    }

    async checkApproved (web3: Web3, tokenAddress: string, jobRequester: string, fundAmount: string) {
        const hmtoken = new web3.eth.Contract(HMTokenAbi as [], tokenAddress);
        const allowance = await hmtoken.methods
            .allowance(jobRequester, web3.eth.defaultAccount)
            .call();
        const balance = await hmtoken.methods
            .balanceOf(jobRequester)
            .call();
        return allowance >= fundAmount && balance >= fundAmount;
    }

    async createEscrow (web3: Web3, factoryAddress: string, token: string,jobRequester: string) {
        const escrowFactory = new web3.eth.Contract(EscrowFactoryAbi as [], factoryAddress);
        const gas = await escrowFactory.methods
            .createEscrow(token, [jobRequester])
            .estimateGas({ from: web3.eth.defaultAccount });
        const gasPrice = await web3.eth.getGasPrice();
        var result = await escrowFactory.methods
            .createEscrow(token, [jobRequester])
            .send({ from: web3.eth.defaultAccount, gas, gasPrice });
        return result.events.Launched.returnValues.escrow;
    }

    async fundEscrow (web3: Web3, tokenAddress: string, jobRequester: string, escrowAddress: string, fundAmount: string) {
        const hmtoken = new web3.eth.Contract(HMTokenAbi as [], tokenAddress);
        const gas = await hmtoken.methods
            .transferFrom(jobRequester, escrowAddress, fundAmount)
            .estimateGas({ from: web3.eth.defaultAccount });
        const gasPrice = await web3.eth.getGasPrice();
        var result = await hmtoken.methods
            .transferFrom(jobRequester, escrowAddress, fundAmount)
            .send({ from: web3.eth.defaultAccount, gas, gasPrice });
    }
}

const escrowPlugin: FastifyPluginAsync = async (server) => {
  server.decorate("escrow", new Escrow());
};

declare module "fastify" {
  interface FastifyInstance {
    escrow: Escrow;
  }
}

export default fp(escrowPlugin);