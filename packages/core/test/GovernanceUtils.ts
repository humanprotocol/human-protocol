import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { mine } from '@nomicfoundation/hardhat-network-helpers';
import {
  MetaHumanGovernor,
  VHMToken,
  DAOSpokeContract,
  WormholeMock,
} from '../typechain-types';
import {
  IWormholeVM,
  IWormholeSignature,
  SignatureComponents,
} from './GovernanceTypes';

let owner: Signer;

export const mineNBlocks = async (n: number) => {
  await mine(n);
};

export async function createMockUserWithVotingPower(
  voteToken: VHMToken,
  user: Signer
): Promise<Signer> {
  [owner] = await ethers.getSigners();

  await voteToken
    .connect(owner)
    .transfer(await user.getAddress(), ethers.parseEther('1'));

  const voteTokenWithUser = voteToken.connect(user);
  await voteTokenWithUser.delegate(await user.getAddress());
  return user;
}

export async function createMessageWithPayload(
  payload: string,
  emitterChainId: number,
  emitterAddress: string
): Promise<IWormholeVM> {
  const signatures: IWormholeSignature[] = [];
  const mockVM: IWormholeVM = {
    version: 0,
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

export async function callReceiveMessageWithWormholeMock(
  wormholeMock: WormholeMock,
  result: IWormholeVM
): Promise<void> {
  const vaas: string[] = [];

  await wormholeMock.receiveWormholeMessages(
    result.payload,
    vaas,
    ethers.zeroPadBytes(result.emitterAddress, 32),
    result.emitterChainId,
    result.hash,
    {
      value: 100,
    }
  );
}

export async function createProposalMessage(
  contractAddress: string,
  proposalId: number,
  emitterAddress: string
): Promise<IWormholeVM> {
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
    [contractAddress, spokeChainId, emitterAddress, message]
  );

  return await createMessageWithPayload(payload, hubChainId, emitterAddress);
}

export async function createProposalOnSpoke(
  daoSpoke: DAOSpokeContract,
  wormholeMock: WormholeMock,
  proposalId: number,
  governorAddress: string
): Promise<number> {
  const mockResult = await createProposalMessage(
    await daoSpoke.getAddress(),
    proposalId,
    governorAddress
  );

  await callReceiveMessageWithWormholeMock(wormholeMock, mockResult);
  return proposalId;
}

export async function createBasicProposal(
  daoSpoke: DAOSpokeContract,
  wormholeMock: WormholeMock,
  voteToken: VHMToken,
  governor: MetaHumanGovernor,
  owner: Signer
): Promise<string> {
  const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
    await owner.getAddress(),
    ethers.parseEther('1'),
  ]);
  const targets = [await voteToken.getAddress()];
  const values = [0];
  const calldatas = [encodedCall];

  const txResponse = await governor.crossChainPropose(
    targets,
    values,
    calldatas,
    '',
    {
      value: 100,
    }
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

  await createProposalOnSpoke(
    daoSpoke,
    wormholeMock,
    proposalId,
    await governor.getAddress()
  );
  return proposalId;
}

export async function finishProposal(
  daoSpoke: DAOSpokeContract,
  wormholeMock: WormholeMock,
  proposalId: number,
  governorAddress: string
): Promise<void> {
  const spokeChainId = 6;
  const hubChainId = 5;
  const defaultAbiCoder = new ethers.AbiCoder();

  const message = defaultAbiCoder.encode(
    ['uint16', 'uint256'],
    [1, proposalId]
  );

  const payload = defaultAbiCoder.encode(
    ['address', 'uint256', 'address', 'bytes'],
    [await daoSpoke.getAddress(), spokeChainId, governorAddress, message]
  );

  const mockResult = await createMessageWithPayload(
    payload,
    hubChainId,
    governorAddress
  );

  await callReceiveMessageWithWormholeMock(wormholeMock, mockResult);
}

export async function collectVotesFromSpoke(
  daoSpoke: DAOSpokeContract,
  wormholeMock: WormholeMock,
  proposalId: string,
  governor: MetaHumanGovernor
): Promise<void> {
  const spokeChainId = 6;
  const hubChainId = 5;
  const defaultAbiCoder = new ethers.AbiCoder();

  const message = defaultAbiCoder.encode(
    ['uint16', 'uint256', 'uint256', 'uint256', 'uint256'],
    [0, proposalId, ethers.parseEther('1'), 0, 0]
  );

  const payload = defaultAbiCoder.encode(
    ['address', 'uint256', 'address', 'bytes'],
    [
      await governor.getAddress(),
      hubChainId,
      await daoSpoke.getAddress(),
      message,
    ]
  );

  const mockResult = await createMessageWithPayload(
    payload,
    spokeChainId,
    await daoSpoke.getAddress()
  );

  await callReceiveMessageWithWormholeMock(wormholeMock, mockResult);
}

export async function signProposalWithReasonAndParams(
  proposalId: string,
  governor: MetaHumanGovernor,
  support: number,
  reason: string,
  params: string,
  signer: Signer
): Promise<SignatureComponents> {
  const signature = await signer.signTypedData(
    {
      name: 'MetaHumanGovernor',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await governor.getAddress(),
    },
    {
      Ballot: [
        {
          name: 'proposalId',
          type: 'uint256',
        },
        {
          name: 'support',
          type: 'uint8',
        },
        {
          name: 'reason',
          type: 'bytes32',
        },
        {
          name: 'params',
          type: 'bytes32',
        },
      ],
    },
    {
      proposalId,
      support,
      reason,
      params,
    }
  );

  // Extract the signature components
  const r = signature.slice(0, 66);
  const s = '0x' + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  return { v, r, s };
}

export async function signProposal(
  proposalId: string,
  governor: MetaHumanGovernor,
  support: number,
  signer: Signer
): Promise<SignatureComponents> {
  const signature = await signer.signTypedData(
    {
      name: 'MetaHumanGovernor',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await governor.getAddress(),
    },
    {
      Ballot: [
        {
          name: 'proposalId',
          type: 'uint256',
        },
        {
          name: 'support',
          type: 'uint8',
        },
      ],
    },
    {
      proposalId,
      support,
    }
  );

  // Extract the signature components
  const r = signature.slice(0, 66);
  const s = '0x' + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  return { v, r, s };
}

export async function updateVotingDelay(
  daoSpoke: DAOSpokeContract,
  voteToken: VHMToken,
  governor: MetaHumanGovernor,
  wormholeMockForGovernor: WormholeMock,
  newDelay: number,
  executer: Signer
): Promise<void> {
  // mock account with voting power
  await voteToken.transfer(await executer.getAddress(), ethers.parseEther('5'));
  await voteToken.connect(executer).delegate(await executer.getAddress());

  const encodedCall = governor.interface.encodeFunctionData('setVotingDelay', [
    newDelay,
  ]);
  const targets = [await governor.getAddress()];
  const values = [0];
  const calldatas = [encodedCall];

  const txResponse = await governor.crossChainPropose(
    targets,
    values,
    calldatas,
    'setVotingDelay',
    {
      value: 100,
    }
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

  // wait for next block
  await mineNBlocks(2);
  //cast vote
  await governor.connect(executer).castVote(proposalId, 1);

  // wait for voting block to end
  await mineNBlocks(50410);
  await governor.requestCollections(proposalId, { value: 100 });
  await collectVotesFromSpoke(
    daoSpoke,
    wormholeMockForGovernor,
    proposalId,
    governor
  );

  await governor.queue(targets, values, calldatas, ethers.id('setVotingDelay'));
  await governor.execute(
    targets,
    values,
    calldatas,
    ethers.id('setVotingDelay')
  );

  expect((await governor.votingDelay()).toString()).to.equal(
    newDelay.toString()
  );
}
