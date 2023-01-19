import { IEscrowNetwork } from "constants/networks.js";
import { createWeb3 } from "../utils/web3.js";
import EscrowFactoryAbi from '@human-protocol/core/abis/EscrowFactory.json' assert { type: "json" };
import HMTokenAbi from '@human-protocol/core/abis/HMToken.json' assert { type: "json" };
import EscrowAbi from '@human-protocol/core/abis/Escrow.json' assert { type: "json" };
import { escrow as escrowSchema } from '../schemas/escrow.js';
import Web3 from "web3";
import { uploadManifest } from "./s3Service.js";
import { REC_ORACLE_ADDRESS, REC_ORACLE_PERCENTAGE_FEE, REP_ORACLE_ADDRESS, REP_ORACLE_PERCENTAGE_FEE } from "../constants/oracles.js";

export const launchEscrow = async (network: IEscrowNetwork, escrow: typeof escrowSchema.properties) => {
    const web3 = createWeb3(network);
    const jobRequester = escrow.jobRequester as unknown as string;
    const token = escrow.token as unknown as string;
    const fundAmount = web3.utils.toWei(Number(escrow.fundAmount).toString(), 'ether');
    if (await checkApproved(web3, token, jobRequester, fundAmount)) {
        const escrowAddress = await createEscrow(web3, network.factoryAddress, jobRequester);
        await fundEscrow(web3, token, jobRequester, escrowAddress, fundAmount);
        await setupEscrow(web3, escrowAddress, escrow);
        return escrowAddress;
    }
    return 'Balance or allowance not enough for funding the escrow';
}

export const checkApproved = async (web3: Web3, tokenAddress: string, jobRequester: string, fundAmount: string) => {
    const hmtoken = new web3.eth.Contract(HMTokenAbi as [], tokenAddress);
    const allowance = await hmtoken.methods
        .allowance(jobRequester, web3.eth.defaultAccount)
        .call();
    const balance = await hmtoken.methods
        .balanceOf(jobRequester)
        .call();
    console.log(balance)
    console.log(fundAmount)
    console.log(allowance)
    return allowance == fundAmount && balance >= fundAmount;
}

export const createEscrow = async (web3: Web3, factoryAddress: string, jobRequester: string) => {
    const escrowFactory = new web3.eth.Contract(EscrowFactoryAbi as [], factoryAddress);
    const gas = await escrowFactory.methods
        .createEscrow([jobRequester])
        .estimateGas({ from: web3.eth.defaultAccount });
    const gasPrice = await web3.eth.getGasPrice();
    var result = await escrowFactory.methods
        .createEscrow([])
        .send({ from: web3.eth.defaultAccount, gas, gasPrice });
    return result.events.Launched.returnValues.escrow;
};

export const fundEscrow = async (web3: Web3, tokenAddress: string, jobRequester: string, escrowAddress: string, fundAmount: string) => {
    const hmtoken = new web3.eth.Contract(HMTokenAbi as [], tokenAddress);
    const gas = await hmtoken.methods
        .transferFrom(jobRequester, escrowAddress, fundAmount)
        .estimateGas({ from: web3.eth.defaultAccount });
    const gasPrice = await web3.eth.getGasPrice();
    var result = await hmtoken.methods
        .transferFrom(jobRequester, escrowAddress, fundAmount)
        .send({ from: web3.eth.defaultAccount, gas, gasPrice });
};

export const setupEscrow = async (web3: Web3, escrowAddress: string, escrow: typeof escrowSchema.properties) => {
    const url = await uploadManifest(escrow, escrowAddress);
    console.log(url);
    const escrowContract = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
    const gas = await escrowContract.methods
        .setup(REP_ORACLE_ADDRESS, REC_ORACLE_ADDRESS, REP_ORACLE_PERCENTAGE_FEE, REC_ORACLE_PERCENTAGE_FEE, url, url)
        .estimateGas({ from: web3.eth.defaultAccount });
    const gasPrice = await web3.eth.getGasPrice();
    var result = await escrowContract.methods
        .setup(REP_ORACLE_ADDRESS, REC_ORACLE_ADDRESS, REP_ORACLE_PERCENTAGE_FEE, REC_ORACLE_PERCENTAGE_FEE, url, url)
        .send({ from: web3.eth.defaultAccount, gas, gasPrice });
};