/* eslint-disable no-console */
import { providers } from 'ethers';
import { StakingClient } from '../src/staking';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';

export const getLeaders = async () => {
  if (!NETWORKS[ChainId.POLYGON_MUMBAI]) {
    return;
  }

  const jsonRPCProvider = new providers.JsonRpcProvider();
  const escrowClient = new StakingClient(
    jsonRPCProvider,
    NETWORKS[ChainId.POLYGON_MUMBAI]
  );

  const leaders = await escrowClient.getLeaders();

  console.log('Leaders:', leaders);

  const leader = await escrowClient.getLeader(leaders[0].address);

  console.log('First leader: ', leader);

  const reputationOracles = await escrowClient.getLeaders({
    role: 'Reputation Oracle',
  });

  console.log('Reputation Oracles: ', reputationOracles);
};

(async () => {
  getLeaders();
})();
