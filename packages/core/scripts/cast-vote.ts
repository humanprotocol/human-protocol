import { ethers } from 'hardhat';
import { DeploymentUtils } from './deployment-utils';

async function main() {
  const utils = new DeploymentUtils();

  const { targets, values, calldatas, description } =
    await utils.getProposalExecutionData();

  console.log('Targets:', targets);
  console.log('Values:', values);
  console.log('Calldatas:', calldatas);
  console.log('Description:', description);

  const governanceAddress = process.env.GOVERNANCE_ADDRESS || '';
  const governanceContract = await ethers.getContractAt(
    'MetaHumanGovernor',
    governanceAddress,
    new ethers.Wallet(utils.deployerPrivateKey, ethers.provider)
  );

  const proposalId = await governanceContract.hashProposal(
    targets,
    values,
    calldatas,
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
  );

  console.log('Casting vote for proposal ID:', proposalId);
  await governanceContract.castVote(proposalId, 1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
