import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

export const getProposal = async () => {
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const description = process.env.DESCRIPTION || '';

  if (!deployerPrivateKey || !governorAddress || !description) {
    throw new Error('One or more required environment variables are missing.');
  }

  // const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);
  // const governanceContract = await ethers.getContractAt(
  //   'MetaHumanGovernor',
  //   governorAddress,
  //   deployerSigner
  // );

  // const encodedCall = governanceContract.interface.encodeFunctionData(
  //   'setVotingPeriod',
  //   [3600]
  // );

  // Proposal data
  const targets = [ethers.ZeroAddress];
  const values = [0];
  // const calldatas = [encodedCall];
  const calldatas = ['0x'];

  // Example inputs (replace with actual values)
  const descriptionHash = ethers.id(description);

  // Encode the data similar to Solidity's `abi.encode`
  const encodedData = abiCoder.encode(
    ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
    [targets, values, calldatas, descriptionHash]
  );

  // Compute the keccak256 hash
  const hash = ethers.keccak256(encodedData);

  // Convert to uint256 (BigNumber)
  const proposalId = ethers.toBigInt(hash);

  return {
    proposalId,
    targets,
    values,
    calldatas,
    description,
    descriptionHash,
  };
};
