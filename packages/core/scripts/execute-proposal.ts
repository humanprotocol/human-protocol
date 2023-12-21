/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils'; // Adjust the path as necessary

async function main() {
  const utils = new DeploymentUtils();

  const MetaHumanGovernor = await ethers.getContractFactory(
    'MetaHumanGovernor'
  );
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const governanceContract = MetaHumanGovernor.attach(governorAddress);

  const { targets, values, calldatas, description } =
    await utils.getProposalExecutionData();

  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(description)
  );
  const tx = await governanceContract.execute(
    targets,
    values,
    calldatas,
    descriptionHash
  );
  await tx.wait();
  console.log('Proposal executed successfully');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
