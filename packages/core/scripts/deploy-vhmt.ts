/* eslint-disable no-console */
import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // HMTDeployment
  // const HMToken = await ethers.getContractFactory(
  //   'contracts/HMToken.sol:HMToken'
  // );
  // const HMTokenContract = await HMToken.deploy(
  //   1000000000,
  //   'HUMAN Token',
  //   18,
  //   'HMT'
  // );
  // await HMTokenContract.waitForDeployment();
  // console.log('HMToken Address: ', await HMTokenContract.getAddress());

  const hmtTokenAddress = process.env.HMT_TOKEN_ADDRESS || '';
  if (!hmtTokenAddress) {
    throw new Error('HMT Token Address is missing');
  }

  //vHMT Deployment
  const VHMToken = await ethers.getContractFactory(
    'contracts/governance/vhm-token/VHMToken.sol:VHMToken'
  );
  const VHMTokenContract = await VHMToken.deploy(hmtTokenAddress);
  await VHMTokenContract.waitForDeployment();
  console.log('VHMToken deployed to:', await VHMTokenContract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
