/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils'; // Ensure the path is correct

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
  const tx = await governanceContract.queue(
    targets,
    values,
    calldatas,
    descriptionHash
  );
  await tx.wait();

  console.log('Proposal queued successfully');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
