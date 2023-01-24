import { describe, test, expect, beforeAll } from 'vitest';
import { ChainId, IEscrowNetwork } from "../../src/constants/networks.js";
import EscrowAbi from '@human-protocol/core/abis/Escrow.json' assert { type: "json" };
import HMTokenAbi from '@human-protocol/core/abis/HMToken.json' assert { type: "json" };
import server from '../../src/server.js'
import { stake, approve } from '../utils.js'

const jobRequesterPrivKey = 'de9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0';
const jobRequester = '0xdD2FD4581271e230360230F9337D5c0430Bf44C0';

describe('Escrow tests', () => {
  const { escrow, web3 } = server;
  const network: IEscrowNetwork = {
    chainId: ChainId.LOCALHOST,
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    rpcUrl: 'http://localhost:8546',
    title: 'Localhost'
  };
  const web3Client = web3.createWeb3(network);
  const web3JobRequester = web3.createWeb3(network, jobRequesterPrivKey);
  
  beforeAll(async () => {
    await stake(web3Client, network);
  });

  test('Should not be approved', async () => {
    expect(await escrow.checkApproved(web3Client, network.hmtAddress, jobRequester, web3Client.utils.toWei('10', 'ether'))).eq(false);
  });

  test('Should be approved', async () => {
    const amount = web3JobRequester.utils.toWei('10', 'ether');
    await approve(web3JobRequester, network, web3Client.eth.defaultAccount as string, amount);
    expect(await escrow.checkApproved(web3Client, network.hmtAddress, jobRequester, web3Client.utils.toWei('10', 'ether'))).eq(true);
  });

  test('Should create an escrow', async () => {
    const escrowAddress = await escrow.createEscrow(web3Client, network.factoryAddress, network.hmtAddress, jobRequester);
    const escrowContract = new web3Client.eth.Contract(EscrowAbi as [], escrowAddress);
    expect(await escrowContract.methods.launcher().call()).eq(network.factoryAddress);
  });

  test('Should fund an escrow', async () => {
    const escrowAddress = await escrow.createEscrow(web3Client, network.factoryAddress, network.hmtAddress, jobRequester);
    const escrowContract = new web3Client.eth.Contract(EscrowAbi as [], escrowAddress);
    const amount = web3Client.utils.toWei('10', 'ether');
    await escrow.fundEscrow(web3Client, network.hmtAddress, jobRequester, escrowAddress, amount);
    const hmtContract = new web3Client.eth.Contract(HMTokenAbi as [], network.hmtAddress);
    expect(await hmtContract.methods.balanceOf(escrowAddress).call()).eq(amount);
  });

  test('Should setup an escrow ', async () => {
    const escrowAddress = await escrow.createEscrow(web3Client, network.factoryAddress, network.hmtAddress, jobRequester);
    const escrowContract = new web3Client.eth.Contract(EscrowAbi as [], escrowAddress);
    const url = 'http://test.com';
    await escrow.setupEscrow(web3Client, escrowAddress, url, 3);
    expect(await escrowContract.methods.manifestUrl().call()).eq(url);
    expect(Number(await escrowContract.methods.remainingFortunes().call())).eq(3);
  });
  
});