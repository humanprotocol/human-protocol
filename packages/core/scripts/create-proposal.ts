/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils'; // Ensure this path is correct

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  const governorAddress = process.env.GOVERNOR_ADDRESS;

  if (!deployerPrivateKey || !governorAddress) {
    throw new Error(
      'Environment variables PRIVATE_KEY or GOVERNOR_ADDRESS are not set.'
    );
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);

  const MetaHumanGovernor = await ethers.getContractFactory(
    'MetaHumanGovernor',
    deployerSigner
  );
  const governanceContract = MetaHumanGovernor.attach(governorAddress);

  const utils = new DeploymentUtils();
  const { targets, values, calldatas, description } =
    await utils.getProposalExecutionData();

  const tx = await governanceContract.crossChainPropose(
    targets,
    values,
    calldatas,
    description,
    { value: ethers.utils.parseEther('0.1') }
  );
  await tx.wait();

  console.log('Proposal created successfully');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
