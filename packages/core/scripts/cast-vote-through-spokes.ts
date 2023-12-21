/* eslint-disable no-console */
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { DeploymentUtils } from './deployment-utils';
import 'dotenv/config';

async function main() {
  const [deployer] = await ethers.getSigners();

  const spokeAddress = process.env.SPOKE_ADDRESS;
  if (!spokeAddress) {
    throw new Error('SPOKE_ADDRESS is not set in environment variables');
  }

  const thirdPrivateKey = process.env.THIRD_PRIVATE_KEY;
  if (!thirdPrivateKey) {
    throw new Error('THIRD_PRIVATE_KEY is not set in environment variables');
  }
  const thirdSigner = new ethers.Wallet(thirdPrivateKey, ethers.provider);

  const DAOSpokeContract = await ethers.getContractFactory('DAOSpokeContract');
  const spokeContract =
    DAOSpokeContract.attach(spokeAddress).connect(thirdSigner);

  const utils = new DeploymentUtils();
  const { targets, values, calldatas, description } =
    await utils.getProposalExecutionData();

  const proposalId = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
      [
        targets,
        values,
        calldatas,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description)),
      ]
    )
  );

  await spokeContract.castVote(BigNumber.from(proposalId), 1);
  console.log(`Vote cast for proposal ${proposalId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
