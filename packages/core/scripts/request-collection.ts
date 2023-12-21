/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils';

async function main() {
  const utils = new DeploymentUtils();

  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const MetaHumanGovernor = await ethers.getContractFactory(
    'MetaHumanGovernor'
  );
  const governanceContract = MetaHumanGovernor.attach(governorAddress);

  const { targets, values, calldatas, description } =
    await utils.getProposalExecutionData();

  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(description)
  );
  const proposalId = await governanceContract.hashProposal(
    targets,
    values,
    calldatas,
    descriptionHash
  );
  const tx = await governanceContract.requestCollections(proposalId);
  await tx.wait();

  console.log(
    `Collections requested for proposal ID: ${proposalId.toString()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
