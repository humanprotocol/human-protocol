/* eslint-disable no-console */
import { ethers } from 'hardhat';

async function main() {
  const HMToken = await ethers.getContractFactory('HMToken');
  const hmToken = await HMToken.deploy(
    ethers.utils.parseEther('1000'),
    'HMToken',
    18,
    'HMT'
  );

  await hmToken.deployed();
  console.log('HMToken deployed to:', hmToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
