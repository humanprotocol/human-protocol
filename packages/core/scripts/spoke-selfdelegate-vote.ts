import { ethers } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const secondPrivateKey = process.env.SECOND_PRIVATE_KEY;
  const thirdPrivateKey = process.env.THIRD_PRIVATE_KEY;
  const spokeVoteTokenAddress = process.env.SPOKE_VOTE_TOKEN_ADDRESS;

  if (!secondPrivateKey || !thirdPrivateKey || !spokeVoteTokenAddress) {
    throw new Error('One or more required environment variables are missing.');
  }

  const secondSigner = new ethers.Wallet(secondPrivateKey, ethers.provider);
  const thirdSigner = new ethers.Wallet(thirdPrivateKey, ethers.provider);

  const VHMToken = await ethers.getContractAt(
    'VHMToken',
    spokeVoteTokenAddress
  );

  await VHMToken.connect(secondSigner).delegate(secondSigner.address);
  console.log(`Delegated to ${secondSigner.address}`);

  await VHMToken.connect(thirdSigner).delegate(thirdSigner.address);
  console.log(`Delegated to ${thirdSigner.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
