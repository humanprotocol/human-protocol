import { ethers } from "hardhat";
import { Signer } from "ethers";
import {
  MetaHumanGovernor,
  VHMToken,
  DAOSpokeContract,
  WormholeMock,
} from "../typechain-types";
import { IWormholeVM, IWormholeSignature } from "./GovernanceTypes";

let owner: Signer;

export const mineNBlocks = async (n: number) => {
  await Promise.all(
    Array(n)
      .fill(0)
      .map(async () => {
        await ethers.provider.send("evm_mine", []);
      }),
  );
};

export async function createMockUserWithVotingPower(
  voteToken: VHMToken,
  user: Signer,
): Promise<Signer> {
  [owner] = await ethers.getSigners();

  await voteToken
    .connect(owner)
    .transfer(await user.getAddress(), ethers.parseEther("1"));

  const voteTokenWithUser = voteToken.connect(user);
  await voteTokenWithUser.delegate(await user.getAddress());
  return user;
}

export async function createMessageWithPayload(
  payload: string,
  emitterChainId: number,
  emitterAddress: string,
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

export async function callReceiveMessageOnSpokeWithMock(
  wormholeMock: WormholeMock,
  result: IWormholeVM,
): Promise<void> {
  const vaas: string[] = [];

  await wormholeMock.receiveWormholeMessages(
    result.payload,
    vaas,
    ethers.zeroPadBytes(result.emitterAddress, 32),
    result.emitterChainId,
    result.hash,
    {
      value: ethers.parseEther("0.1"),
    },
  );
}

export async function createProposalMessage(
  contractAddress: string,
  proposalId: number,
  emitterAddress: string,
): Promise<IWormholeVM> {
  const spokeChainId = 6;
  const hubChainId = 5;

  const latestBlock = await ethers.provider.getBlock("latest");
  if (!latestBlock) {
    throw new Error("Failed to fetch the latest block");
  }
  const currentBlockTimestamp = latestBlock.timestamp;
  const futureTimestamp = currentBlockTimestamp + 1000;

  const defaultAbiCoder = new ethers.AbiCoder();

  const message = defaultAbiCoder.encode(
    ["uint16", "uint256", "uint256", "uint256", "uint256"],
    [
      0,
      proposalId,
      currentBlockTimestamp,
      currentBlockTimestamp,
      futureTimestamp,
    ],
  );

  const payload = defaultAbiCoder.encode(
    ["address", "uint256", "address", "bytes"],
    [contractAddress, spokeChainId, emitterAddress, message],
  );

  return await createMessageWithPayload(payload, hubChainId, emitterAddress);
}

export async function createProposalOnSpoke(
  daoSpoke: DAOSpokeContract,
  wormholeMock: WormholeMock,
  proposalId: number,
  governorAddress: string,
): Promise<number> {
  const mockResult = await createProposalMessage(
    await daoSpoke.getAddress(),
    proposalId,
    governorAddress,
  );

  await callReceiveMessageOnSpokeWithMock(wormholeMock, mockResult);
  return proposalId;
}

export async function createBasicProposal(
  daoSpoke: DAOSpokeContract,
  wormholeMock: WormholeMock,
  voteToken: VHMToken,
  governor: MetaHumanGovernor,
  owner: Signer,
): Promise<string> {
  const encodedCall = voteToken.interface.encodeFunctionData("transfer", [
    await owner.getAddress(),
    ethers.parseEther("1"),
  ]);
  const targets = [await voteToken.getAddress()];
  const values = [0];
  const calldatas = [encodedCall];

  const txResponse = await governor.crossChainPropose(
    targets,
    values,
    calldatas,
    "",
  );
  const receipt = await txResponse.wait();
  const eventSignature = ethers.id(
    "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",
  );

  const event = receipt?.logs?.find((log) => log.topics[0] === eventSignature);

  if (!event) throw new Error("ProposalCreated event not found");

  const decodedData = governor.interface.decodeEventLog(
    "ProposalCreated",
    event.data,
    event.topics,
  );

  const proposalId = decodedData[0];

  await createProposalOnSpoke(
    daoSpoke,
    wormholeMock,
    proposalId,
    await governor.getAddress(),
  );
  return proposalId;
}

export async function finishProposal(
  daoSpoke: DAOSpokeContract,
  wormholeMock: WormholeMock,
  proposalId: number,
  governorAddress: string,
): Promise<void> {
  const spokeChainId = 6;
  const hubChainId = 5;
  const defaultAbiCoder = new ethers.AbiCoder();

  const message = defaultAbiCoder.encode(
    ["uint16", "uint256"],
    [1, proposalId],
  );

  const payload = defaultAbiCoder.encode(
    ["address", "uint256", "address", "bytes"],
    [await daoSpoke.getAddress(), spokeChainId, governorAddress, message],
  );

  const mockResult = await createMessageWithPayload(
    payload,
    hubChainId,
    governorAddress,
  );

  await callReceiveMessageOnSpokeWithMock(wormholeMock, mockResult);
}