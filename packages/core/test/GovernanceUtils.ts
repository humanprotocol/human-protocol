import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import {
  MetaHumanGovernor,
  VHMToken,
  DAOSpokeContract,
  Governor,
} from '../typechain-types';
import { IWormholeVM, IWormholeSignature } from './GovernanceTypes';

let owner: Signer;
let someUser: Signer;

export const mineNBlocks = async (n: number) => {
  await Promise.all(
    Array(n)
      .fill(0)
      .map(async () => {
        await ethers.provider.send('evm_mine', []);
      })
  );
};

export async function createMockUserWithVotingPower(
  voteToken: VHMToken,
  user: Signer
): Promise<Signer> {
  [owner, someUser, user] = await ethers.getSigners();

  voteToken
    .connect(owner)
    .transfer(await user.getAddress(), ethers.parseEther('1'));
  const voteTokenWithUser = voteToken.connect(user);
  await voteTokenWithUser.delegate(await user.getAddress());
  return user;
}

async function _createMessageWithPayload(
  payload: string,
  emitterChainId: number,
  emitterAddress: string
): Promise<IWormholeVM> {
  const signatures: IWormholeSignature[] = [];
  const mockVM: IWormholeVM = {
    version: 1,
    timestamp: 0,
    nonce: 0,
    emitterChainId: emitterChainId,
    emitterAddress: emitterAddress,
    sequence: 0,
    consistencyLevel: 200,
    payload: payload,
    guardianSetIndex: 0,
    signatures: signatures,
    hash: ethers.keccak256(payload),
  };

  return mockVM;
}

async function _callReceiveMessageOnSpokeWithMock(
  daoSpoke: DAOSpokeContract,
  wormholeMock: Signer,
  result: IWormholeVM
): Promise<void> {
  const vaas: string[] = [];

  await daoSpoke
    .connect(wormholeMock)
    .receiveWormholeMessages(
      result.payload,
      vaas,
      ethers.zeroPadBytes(result.emitterAddress, 32),
      result.emitterChainId,
      result.hash
    );
}

export async function createProposalOnSpoke(
  daoSpoke: DAOSpokeContract,
  wormholeMock: Signer,
  proposalId: number,
  governorAddress: string
): Promise<number> {
  const spokeChainId = 6;
  const hubChainId = 5;

  const latestBlock = await ethers.provider.getBlock('latest');
  if (!latestBlock) {
    throw new Error('Failed to fetch the latest block');
  }
  const currentBlockTimestamp = latestBlock.timestamp;
  const futureTimestamp = currentBlockTimestamp + 1000;

  const defaultAbiCoder = new ethers.AbiCoder();

  const message = defaultAbiCoder.encode(
    ['uint16', 'uint256', 'uint256', 'uint256', 'uint256'],
    [
      0,
      proposalId,
      currentBlockTimestamp,
      currentBlockTimestamp,
      futureTimestamp,
    ]
  );

  const payload = defaultAbiCoder.encode(
    ['address', 'uint256', 'address', 'bytes'],
    [await daoSpoke.getAddress(), spokeChainId, governorAddress, message]
  );

  const mockResult = await _createMessageWithPayload(
    payload,
    hubChainId,
    governorAddress
  );

  await _callReceiveMessageOnSpokeWithMock(daoSpoke, wormholeMock, mockResult);
  return proposalId;
}

export async function createBasicProposal(
  voteToken: VHMToken,
  governor: MetaHumanGovernor,
  owner: Signer
): Promise<string> {
  const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
    await owner.getAddress(),
    1,
  ]);
  const targets = [await voteToken.getAddress()];
  const values = [0];
  const calldatas = [encodedCall];

  // Compute the proposal ID in advance
  const proposalIdPrecomputed = await governor.hashProposal(
    targets,
    values,
    calldatas,
    ethers.encodeBytes32String('Description')
  );
  console.log('Precomputed proposal ID: ', proposalIdPrecomputed);

  const txResponse = await governor.crossChainPropose(
    targets,
    values,
    calldatas,
    ''
  );
  const receipt = await txResponse.wait();
  const eventSignature = ethers.id(
    'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)'
  );

  const event = receipt?.logs?.find((log) => log.topics[0] === eventSignature);

  if (!event) throw new Error('ProposalCreated event not found');

  const decodedData = governor.interface.decodeEventLog(
    'ProposalCreated',
    event.data,
    event.topics
  );

  const proposalId = decodedData[0];
  console.log('Proposal ID: ', proposalId.toString());

  return proposalId;
}
