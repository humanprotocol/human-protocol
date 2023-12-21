/* eslint-disable no-console */
import { ethers } from 'hardhat';

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY || '';
  const governorAddress = process.env.GOVERNOR_ADDRESS || '';
  const hmTokenAddress = process.env.HM_TOKEN_ADDRESS || '';

  if (!deployerPrivateKey || !governorAddress || !hmTokenAddress) {
    throw new Error('Environment variables are not set correctly.');
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);

  const HMToken = await ethers.getContractFactory('HMToken', deployerSigner);
  const hmToken = HMToken.attach(hmTokenAddress);

  const MetaHumanGovernor = await ethers.getContractFactory(
    'MetaHumanGovernor',
    deployerSigner
  );
  const governanceContract = MetaHumanGovernor.attach(governorAddress);

  const timelockAddress = await governanceContract.timelock();
  const tx = await hmToken.transfer(
    timelockAddress,
    ethers.utils.parseEther('1')
  );
  await tx.wait();

  console.log(
    `Transferred 1 ether worth of tokens to Timelock at address: ${timelockAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
