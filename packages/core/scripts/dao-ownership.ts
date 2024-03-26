import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const deployerPrivateKey = process.env.PRIVATE_KEY;
  const governorAddress = process.env.GOVERNOR_ADDRESS;
  const timelockAddress = process.env.TIMELOCK_ADDRESS;

  if (!deployerPrivateKey || !governorAddress || !timelockAddress) {
    console.error('One or more required environment variables are missing.');
    return;
  }

  const deployerSigner = new ethers.Wallet(deployerPrivateKey, ethers.provider);

  const governanceContract = await ethers.getContractAt(
    'MetaHumanGovernor',
    governorAddress,
    deployerSigner
  );

  console.log('Transferring ownership...');
  const tx = await governanceContract.transferOwnership(timelockAddress);
  await tx.wait();
  console.log('Ownership transferred successfully to:', timelockAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
