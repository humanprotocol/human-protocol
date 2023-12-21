/* eslint-disable no-console */
import { ethers } from 'hardhat';

async function main() {
  const secondPrivateKey = process.env.SECOND_PRIVATE_KEY || '';
  const thirdPrivateKey = process.env.THIRD_PRIVATE_KEY || '';
  const voteTokenAddress = process.env.HUB_VOTE_TOKEN_ADDRESS || '';

  if (!secondPrivateKey || !thirdPrivateKey || !voteTokenAddress) {
    throw new Error('Environment variables are not set correctly.');
  }

  const VHMToken = await ethers.getContractFactory('VHMToken');
  const vhmToken = VHMToken.attach(voteTokenAddress);

  const secondSigner = new ethers.Wallet(secondPrivateKey, ethers.provider);
  const thirdSigner = new ethers.Wallet(thirdPrivateKey, ethers.provider);

  let tx = await vhmToken.connect(secondSigner).delegate(secondSigner.address);
  await tx.wait();
  console.log(`Delegated votes to second address: ${secondSigner.address}`);

  tx = await vhmToken.connect(thirdSigner).delegate(thirdSigner.address);
  await tx.wait();
  console.log(`Delegated votes to third address: ${thirdSigner.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
