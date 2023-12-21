/* eslint-disable no-console */
import { ethers } from 'hardhat';

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY || '';
  const hmTokenAddress = process.env.HM_TOKEN_ADDRESS || '';
  const addressToFund = process.env.ADDRESS_TO_FUND || '';

  if (!deployerPrivateKey || !hmTokenAddress || !addressToFund) {
    throw new Error('Environment variables are not set correctly.');
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);

  const HMToken = await ethers.getContractFactory('HMToken', deployerSigner);
  const hmToken = await HMToken.attach(hmTokenAddress);

  const amount = ethers.utils.parseEther('1000000'); // Equivalent to 1000000 ether
  const tx = await hmToken.transfer(addressToFund, amount);
  await tx.wait();

  console.log(`Transferred ${amount} tokens to ${addressToFund}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
