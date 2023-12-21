import { Contract, BigNumberish } from 'ethers';
import {
  VHMToken,
  DAOSpokeContract,
  MetaHumanGovernor,
} from '../typechain-types';
import { ethers } from 'hardhat';
import { BigNumber, utils } from 'ethers';
import { Signer } from 'ethers';

interface IWormholeVM {
  version: number;
  timestamp: number;
  nonce: number;
  emitterChainId: number;
  emitterAddress: string;
  sequence: number;
  consistencyLevel: number;
  payload: string;
  guardianSetIndex: number;
  signatures: {
    r: string;
    s: string;
    v: number;
    guardianIndex: number;
  }[];
  hash: string;
}

let governanceContract: MetaHumanGovernor;
let daoSpokeContract: DAOSpokeContract;

export const spokeChainId = 5;
export const hubChainId = 10002;
export const wormholeMockAddress = '0x200';

export function createMockUser(privateKeySeed: number): string {
  const privateKeyBuffer = ethers.utils.zeroPad(
    ethers.utils.arrayify(privateKeySeed),
    32
  );
  const privateKeyHex = ethers.utils.hexlify(privateKeyBuffer);
  const wallet = new ethers.Wallet(privateKeyHex);
  return wallet.address;
}

export async function createMockUserWithVotingPower(
  accountIndex: number,
  _voteToken: VHMToken
): Promise<string> {
  const signers = await ethers.getSigners();
  const someUser = signers[accountIndex];
  await _voteToken.transfer(
    someUser.getAddress(),
    ethers.utils.parseEther('1')
  );
  await _voteToken.connect(someUser).delegate(await someUser.getAddress());
  return someUser.getAddress();
}

export async function createBasicProposal(
  deployer: Signer,
  voteToken: VHMToken,
  governanceContract: MetaHumanGovernor
): Promise<number> {
  const encodedCall = ethers.utils.defaultAbiCoder.encode(
    ['address', 'uint256'],
    [await deployer.getAddress(), ethers.utils.parseEther('1')]
  );

  const targets = [voteToken.address]; // Use the existing voteToken
  const values = [0];
  const calldatas = [encodedCall];

  const tx = await governanceContract.crossChainPropose(
    targets,
    values,
    calldatas,
    ''
  );
  const receipt = await tx.wait();
  const proposalId = receipt.events?.find((e) => e.event === 'ProposalCreated')
    ?.args?.proposalId;

  if (proposalId === undefined) {
    throw new Error('Failed to create proposal');
  }

  return proposalId as number;
}

// // function signature of a mockCall from foundry definition
// export async function mockCall(
//   contract: Contract,
//   where : string,
//   value: BigNumberish,
//   data: BytesLike,
//   retdata: BytesLike
// ): Promise<void> {
//   const tx = await contract.mockCall(where, value, data, retdata);
//   await tx.wait();
// }

// export async function callReceiveMessageOnSpokeWithMock(
//   wormholeMockAddress: string,
//   daoSpokeContract: Contract,
//   result: IWormholeVM
// ): Promise<void> {
//   const parseAndVerifyVMSelector =
//     daoSpokeContract.interface.getSighash('parseAndVerifyVM');

//   const parseAndVerifyVMData = utils.defaultAbiCoder.encode(
//     [
//       'bytes4',
//       'tuple(uint8,uint32,uint32,uint16,bytes32,uint64,uint8,bytes,uint32,Signature[])',
//     ],
//     [parseAndVerifyVMSelector, result]
//   );

//   //   await mockCall(
//   //     daoSpokeContract,
//   //     wormholeMockAddress,
//   //     0,
//   //     parseAndVerifyVMData,
//   //     utils.defaultAbiCoder.encode(['bool', 'string'], [true, "test"])
//   //   );

//   //   await daoSpokeContract.receiveWormholeMessages(
//   //     result.payload,
//   //     [], // Assuming an empty array for vaas
//   //     result.emitterAddress,
//   //     result.emitterChainId,
//   //     result.hash
//   //   );
// }

export function createProposalOnSpoke(
  proposalId: BigNumber | number
): BigNumber {
  const message = utils.defaultAbiCoder.encode(
    ['uint256', 'uint256', 'uint256'],
    [0, proposalId, Math.floor(Date.now() / 1000)]
  );

  const payload = utils.defaultAbiCoder.encode(
    ['address', 'uint16', 'address', 'bytes'],
    [
      daoSpokeContract.address,
      spokeChainId,
      governanceContract.address,
      message,
    ]
  );

  const mockResult = createMessageWithPayload(
    payload,
    spokeChainId,
    daoSpokeContract.address
  );
  callReceiveMessageOnSpokeWithMock(
    wormholeMockAddress,
    daoSpokeContract,
    mockResult
  );
  return BigNumber.from(proposalId);
}

export function createMessageWithPayload(
  payload: string,
  emitterChainId: number,
  emitterAddress: string
): IWormholeVM {
  return {
    version: 0,
    timestamp: 0,
    nonce: 0,
    emitterChainId,
    emitterAddress: ethers.utils.hexZeroPad(emitterAddress, 32),
    sequence: 0,
    consistencyLevel: 200,
    payload,
    guardianSetIndex: 0,
    signatures: [],
    hash: ethers.utils.keccak256(payload),
  };
}

export async function callReceiveMessageOnHubWithMock(
  governanceContractAddress: string,
  wormholeMockAddress: string,
  result: IWormholeVM
): Promise<void> {
  await ethers.provider.send('hardhat_impersonateAccount', [
    wormholeMockAddress,
  ]);
  const impersonatedSigner = await ethers.getSigner(wormholeMockAddress);

  const governanceContract = await ethers.getContractAt(
    'GovernanceContract',
    governanceContractAddress,
    impersonatedSigner
  );

  await governanceContract.receiveWormholeMessages(
    result.payload,
    [], // Assuming vaas is an empty array
    result.emitterAddress,
    result.emitterChainId,
    result.hash
  );

  await ethers.provider.send('hardhat_stopImpersonatingAccount', [
    wormholeMockAddress,
  ]);
}

export function collectVotesFromSpoke(proposalId: BigNumber): void {
  const message = utils.defaultAbiCoder.encode(
    ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
    [0, proposalId, ethers.utils.parseEther('1'), 0, 0]
  );

  const payload = utils.defaultAbiCoder.encode(
    ['address', 'uint16', 'address', 'bytes'],
    [governanceContract.address, hubChainId, daoSpokeContract.address, message]
  );

  const mockResult = createMessageWithPayload(
    payload,
    spokeChainId,
    daoSpokeContract.address
  );
  callReceiveMessageOnHubWithMock(
    governanceContract.address,
    wormholeMockAddress,
    mockResult
  );
}

export async function getHashToSignProposal(
  proposalId: BigNumber,
  support: number,
  contract: MetaHumanGovernor
): Promise<string> {
  const domain = {
    name: 'MetaHumanGovernor',
    version: '1',
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: contract.address,
  };

  const types = {
    Ballot: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
    ],
  };

  const message = {
    proposalId,
    support,
  };

  const ballotTypeHash = await contract.BALLOT_TYPEHASH();

  return utils._TypedDataEncoder.hash(domain, types, {
    ...message,
    ballotTypehash: ballotTypeHash,
  });
}

export async function getHashToSignProposalWithReasonAndParams(
  governanceContract: Contract,
  proposalId: BigNumberish,
  support: number,
  reason: string,
  params: Uint8Array
): Promise<string> {
  const domain = {
    name: 'MetaHumanGovernor',
    version: '1',
    chainId: await ethers.provider
      .getNetwork()
      .then((network) => network.chainId),
    verifyingContract: governanceContract.address,
  };

  const types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    ExtendedBallot: [
      { name: 'EXTENDED_BALLOT_TYPEHASH', type: 'bytes32' },
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'bytes32' },
      { name: 'params', type: 'bytes32' },
    ],
  };

  const domainSeparator = ethers.utils._TypedDataEncoder.hashDomain(domain);
  const ballotTypeHash = await governanceContract.EXTENDED_BALLOT_TYPEHASH();
  const reasonHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(reason));
  const paramsHash = ethers.utils.keccak256(params);

  const ballotData = {
    EXTENDED_BALLOT_TYPEHASH: ballotTypeHash,
    proposalId,
    support,
    reason: reasonHash,
    params: paramsHash,
  };

  const ballotHash = ethers.utils._TypedDataEncoder.hash(
    domain,
    types,
    ballotData
  );

  return ethers.utils.solidityKeccak256(
    ['bytes', 'bytes32', 'bytes32'],
    ['0x1901', domainSeparator, ballotHash]
  );
}
