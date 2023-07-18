import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import EscrowFactoryAbi from '@human-protocol/core/abis/EscrowFactory.json';
import HMTokenAbi from '@human-protocol/core/abis/HMToken.json';
import EscrowAbi from '@human-protocol/core/abis/Escrow.json';
import { escrow as escrowSchema } from '../schemas/escrow';
import Web3 from 'web3';
import { CURSE_WORDS } from '../constants/curseWords';
import { Type } from '@sinclair/typebox';
import Ajv from 'ajv';

const ConfigSchema = Type.Strict(
  Type.Object({
    REC_ORACLE_ADDRESS: Type.String(),
    REP_ORACLE_ADDRESS: Type.String(),
    EX_ORACLE_ADDRESS: Type.String(),
    REC_ORACLE_URL: Type.String(),
    REP_ORACLE_URL: Type.String(),
    EX_ORACLE_URL: Type.String(),
    REC_ORACLE_PERCENTAGE_FEE: Type.Number(),
    REP_ORACLE_PERCENTAGE_FEE: Type.Number(),
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

class Escrow {
  private recOracleAddress = process.env.REC_ORACLE_ADDRESS as string;
  private repOracleAddress = process.env.REP_ORACLE_ADDRESS as string;
  private exOracleAddress = process.env.EX_ORACLE_ADDRESS as string;
  private recOracleUrl = process.env.REC_ORACLE_URL as string;
  private repOracleUrl = process.env.REP_ORACLE_URL as string;
  private exOracleUrl = process.env.EX_ORACLE_URL as string;
  private recOracleFee = Number(process.env.REC_ORACLE_PERCENTAGE_FEE);
  private repOracleFee = Number(process.env.REP_ORACLE_PERCENTAGE_FEE);
  async setupEscrow(
    web3: Web3,
    escrowAddress: string,
    url: string,
    jobRequester: string
  ) {
    const escrowContract = new web3.eth.Contract(
      EscrowAbi as [],
      escrowAddress
    );
    const gas = await escrowContract.methods
      .setup(
        this.repOracleAddress,
        this.recOracleAddress,
        this.repOracleFee,
        this.recOracleFee,
        url,
        url
      )
      .estimateGas({ from: jobRequester });
    const gasPrice = await web3.eth.getGasPrice();
    await escrowContract.methods
      .setup(
        this.repOracleAddress,
        this.recOracleAddress,
        this.repOracleFee,
        this.recOracleFee,
        url,
        url
      )
      .send({ from: jobRequester, gas, gasPrice });
  }

  async checkApproved(
    web3: Web3,
    tokenAddress: string,
    jobRequester: string,
    fundAmount: string
  ) {
    const hmtoken = new web3.eth.Contract(HMTokenAbi as [], tokenAddress);
    const allowance = web3.utils.toBN(
      await hmtoken.methods
        .allowance(jobRequester, web3.eth.defaultAccount)
        .call()
    );
    const balance = web3.utils.toBN(
      await hmtoken.methods.balanceOf(jobRequester).call()
    );
    return (
      allowance.gte(web3.utils.toBN(fundAmount)) &&
      balance.gte(web3.utils.toBN(fundAmount))
    );
  }

  async checkBalance(
    web3: Web3,
    tokenAddress: string,
    jobRequester: string,
    fundAmount: string
  ) {
    const hmtoken = new web3.eth.Contract(HMTokenAbi as [], tokenAddress);
    const balance = web3.utils.toBN(
      await hmtoken.methods.balanceOf(jobRequester).call()
    );
    return balance.gte(web3.utils.toBN(fundAmount));
  }

  async createEscrow(
    web3: Web3,
    factoryAddress: string,
    token: string,
    jobRequester: string
  ) {
    const escrowFactory = new web3.eth.Contract(
      EscrowFactoryAbi as [],
      factoryAddress
    );
    const gas = await escrowFactory.methods
      .createEscrow(token, [])
      .estimateGas({ from: jobRequester });
    const gasPrice = await web3.eth.getGasPrice();
    const result = await escrowFactory.methods
      .createEscrow(token, [])
      .send({ from: jobRequester, gas, gasPrice });
    return result.events.Launched.returnValues.escrow;
  }

  async fundEscrow(
    web3: Web3,
    tokenAddress: string,
    jobRequester: string,
    escrowAddress: string,
    fundAmount: string
  ) {
    const hmtoken = new web3.eth.Contract(HMTokenAbi as [], tokenAddress);
    if (jobRequester === web3.eth.defaultAccount) {
      const gas = await hmtoken.methods
        .transfer(escrowAddress, fundAmount)
        .estimateGas({ from: web3.eth.defaultAccount });
      const gasPrice = await web3.eth.getGasPrice();
      await hmtoken.methods
        .transfer(escrowAddress, fundAmount)
        .send({ from: web3.eth.defaultAccount, gas, gasPrice });
    } else {
      const gas = await hmtoken.methods
        .transferFrom(jobRequester, escrowAddress, fundAmount)
        .estimateGas({ from: web3.eth.defaultAccount });
      const gasPrice = await web3.eth.getGasPrice();
      await hmtoken.methods
        .transferFrom(jobRequester, escrowAddress, fundAmount)
        .send({ from: web3.eth.defaultAccount, gas, gasPrice });
    }
  }

  checkCurseWords(text: string): boolean {
    const words = text.replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
    return CURSE_WORDS.some((w) => words.includes(w));
  }

  addOraclesData(escrow: typeof escrowSchema.properties) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = escrow as any;
    data.recordingOracleAddress = this.recOracleAddress;
    data.reputationOracleAddress = this.repOracleAddress;
    data.exchangeOracleAddress = this.exOracleAddress;
    data.recordingOracleUrl = this.recOracleUrl;
    data.reputationOracleUrl = this.repOracleUrl;
    data.exchangeOracleUrl = this.exOracleUrl;
    return data;
  }
}

const escrowPlugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      '.env file validation failed - ' +
        JSON.stringify(validate.errors, null, 2)
    );
  }
  server.decorate('escrow', new Escrow());
};

declare module 'fastify' {
  interface FastifyInstance {
    escrow: Escrow;
  }
}

export default fp(escrowPlugin);
