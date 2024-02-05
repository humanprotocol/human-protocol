import { ethers } from 'hardhat';
import { Signer, BigNumberish } from 'ethers';
import {
  MetaHumanGovernor,
  VHMToken,
  DAOSpokeContract,
} from '../typechain-types';
import { IWormholeVM } from './GovernanceTypes';

let owner: Signer;

export async function createMockUserWithVotingPower(
  privateKeySeed: number,
  voteToken: VHMToken
): Promise<string> {
  const privateKey = ethers.keccak256(
    ethers.toUtf8Bytes(privateKeySeed.toString())
  );
  const userWallet = new ethers.Wallet(privateKey, ethers.provider);
  const deployerWallet = (await ethers.getSigners())[0];

  await deployerWallet.sendTransaction({
    to: userWallet.address,
    value: ethers.parseEther('1.0'),
  });

  const voteTokenWithSigner = voteToken.connect(owner);
  await voteTokenWithSigner.transfer(
    userWallet.address,
    ethers.parseUnits('1', 18)
  );

  const voteTokenWithUser = voteToken.connect(userWallet);
  await voteTokenWithUser.delegate(userWallet.address);

  return userWallet.getAddress();
}

async function _createMessageWithPayload(
  payload: string,
  emitterChainId: number,
  emitterAddress: string
): Promise<IWormholeVM> {
  const signatures: Signature[] = [];
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
  result: IWormholeVM
): Promise<void> {
  const vaas: string[] = [];

  await daoSpoke.receiveWormholeMessages(
    result.payload,
    vaas,
    result.emitterAddress,
    result.emitterChainId,
    result.hash
  );
}

export async function createProposalOnSpoke(
  daoSpoke: DAOSpokeContract,
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

  const message = ethers.solidityPacked(
    ['uint256', 'uint256', 'uint256', 'uint256'],
    [0, proposalId, currentBlockTimestamp, futureTimestamp]
  );

  const payload = ethers.solidityPacked(
    ['address', 'uint256', 'address', 'bytes'],
    [daoSpoke.getAddress(), spokeChainId, governorAddress, message]
  );

  const mockResult = await _createMessageWithPayload(
    payload,
    hubChainId,
    governorAddress
  );

  await _callReceiveMessageOnSpokeWithMock(daoSpoke, mockResult);
  return proposalId;
}

export async function createBasicProposal(
  voteToken: VHMToken,
  governor: MetaHumanGovernor,
  owner: Signer
): Promise<BigNumberish> {
  const encodedCall = voteToken.interface.encodeFunctionData('transfer', [
    await owner.getAddress(),
    1,
  ]);
  const targets = [await voteToken.getAddress()];
  const values: BigNumberish[] = [0];
  const calldatas = [encodedCall];

  const proposalId: BN = await governor.crossChainPropose(
    targets,
    values,
    calldatas,
    ''
  );

  return proposalId;
}
