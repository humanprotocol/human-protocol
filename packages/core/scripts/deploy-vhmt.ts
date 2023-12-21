/* eslint-disable no-console */
import { ethers } from 'hardhat';

async function main() {
  const hmTokenAddress = process.env.HM_TOKEN_ADDRESS || '';

  if (!hmTokenAddress) {
    throw new Error('HM_TOKEN_ADDRESS environment variable is not set.');
  }

  const VHMToken = await ethers.getContractFactory('VHMToken');
  const vhmToken = await VHMToken.deploy(hmTokenAddress);

  await vhmToken.deployed();
  console.log('VHMToken deployed to:', vhmToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
