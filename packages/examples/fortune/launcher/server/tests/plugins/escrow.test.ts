import { describe, test, expect, beforeAll } from 'vitest';
import {
  ChainId,
  ESCROW_NETWORKS,
  IEscrowNetwork,
} from '../../src/constants/networks';
import EscrowAbi from '@human-protocol/core/abis/Escrow.json' assert { type: 'json' };
import HMTokenAbi from '@human-protocol/core/abis/HMToken.json' assert { type: 'json' };
import getServer from '../../src/server';
import { stake, approve } from '../utils';
import { escrow as escrowSchema } from '../../src/schemas/escrow';

const jobRequesterPrivKey =
  'de9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0';
const jobRequester = '0xdD2FD4581271e230360230F9337D5c0430Bf44C0';

describe('Escrow tests', async () => {
  const server = await getServer();
  const { escrow, web3 } = server;
  const network = ESCROW_NETWORKS[ChainId.LOCALHOST] as IEscrowNetwork;
  const web3Client = web3.createWeb3(network);
  const web3JobRequester = web3.createWeb3(network, jobRequesterPrivKey);

  beforeAll(async () => {
    await stake(web3Client, network, jobRequester);
  });

  test('Should not have balance', async () => {
    expect(
      await escrow.checkBalance(
        web3Client,
        network.hmtAddress,
        jobRequester,
        web3Client.utils.toWei('10000', 'ether')
      )
    ).eq(false);
  });

  test('Should have balance', async () => {
    expect(
      await escrow.checkBalance(
        web3Client,
        network.hmtAddress,
        jobRequester,
        web3Client.utils.toWei('10', 'ether')
      )
    ).eq(true);
  });

  test('Should not be approved', async () => {
    expect(
      await escrow.checkApproved(
        web3Client,
        network.hmtAddress,
        jobRequester,
        web3Client.utils.toWei('10', 'ether')
      )
    ).eq(false);
  });

  test('Should be approved', async () => {
    const amount = web3JobRequester.utils.toWei('10', 'ether');
    await approve(
      web3JobRequester,
      network,
      web3Client.eth.defaultAccount as string,
      amount
    );
    expect(
      await escrow.checkApproved(
        web3Client,
        network.hmtAddress,
        jobRequester,
        web3Client.utils.toWei('10', 'ether')
      )
    ).eq(true);
  });

  test('Should create an escrow', async () => {
    const escrowAddress = await escrow.createEscrow(
      web3Client,
      network.factoryAddress,
      network.hmtAddress,
      jobRequester
    );
    const escrowContract = new web3Client.eth.Contract(
      EscrowAbi as [],
      escrowAddress
    );
    expect(await escrowContract.methods.launcher().call()).eq(jobRequester);
    expect(await escrowContract.methods.escrowFactory().call()).eq(
      network.factoryAddress
    );
  });

  test('Should fund an escrow', async () => {
    const escrowAddress = await escrow.createEscrow(
      web3Client,
      network.factoryAddress,
      network.hmtAddress,
      jobRequester
    );
    const amount = web3Client.utils.toWei('10', 'ether');
    await escrow.fundEscrow(
      web3Client,
      network.hmtAddress,
      jobRequester,
      escrowAddress,
      amount
    );
    const hmtContract = new web3Client.eth.Contract(
      HMTokenAbi as [],
      network.hmtAddress
    );
    expect(await hmtContract.methods.balanceOf(escrowAddress).call()).eq(
      amount
    );
  });

  test('Should setup an escrow', async () => {
    const escrowAddress = await escrow.createEscrow(
      web3Client,
      network.factoryAddress,
      network.hmtAddress,
      jobRequester
    );
    const escrowContract = new web3Client.eth.Contract(
      EscrowAbi as [],
      escrowAddress
    );
    const url = 'http://test.com';
    await escrow.setupEscrow(web3Client, escrowAddress, url, jobRequester);
    expect(await escrowContract.methods.manifestUrl().call()).eq(url);
  });

  test('Should not detect curse words', () => {
    expect(escrow.checkCurseWords('hello world')).eq(false);
  });

  test('Should detect curse words', () => {
    expect(escrow.checkCurseWords('porn')).eq(true);
  });

  test('Should add oracles info', () => {
    const escrowData = {
      chainId: 1338,
      title: 'title 1',
      description: 'description 1',
      fortunesRequired: 2,
      token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      fundAmount: 1,
      jobRequester: jobRequester,
    };
    const result = escrow.addOraclesData(
      escrowData as unknown as typeof escrowSchema.properties
    );

    expect(result.recordingOracleAddress).eq(process.env.REC_ORACLE_ADDRESS);
    expect(result.reputationOracleAddress).eq(process.env.REP_ORACLE_ADDRESS);
    expect(result.exchangeOracleAddress).eq(process.env.EX_ORACLE_ADDRESS);
    expect(result.recordingOracleUrl).eq(process.env.REC_ORACLE_URL);
    expect(result.reputationOracleUrl).eq(process.env.REP_ORACLE_URL);
    expect(result.exchangeOracleUrl).eq(process.env.EX_ORACLE_URL);
  });
});
