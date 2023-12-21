/* eslint-disable no-console */
import { ethers } from 'hardhat';

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY || '';
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const timelockAddress = process.env.TIMELOCK_ADDRESS || '';

  if (!deployerPrivateKey || !governorAddress || !timelockAddress) {
    throw new Error('Environment variables are not set correctly.');
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);

  const MetaHumanGovernor = await ethers.getContractFactory(
    'MetaHumanGovernor',
    deployerSigner
  );
  const governanceContract = MetaHumanGovernor.attach(governorAddress);

  const tx = await governanceContract.transferOwnership(timelockAddress);
  await tx.wait();

  console.log(
    `Ownership of MetaHumanGovernor transferred to TimelockController at address: ${timelockAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
