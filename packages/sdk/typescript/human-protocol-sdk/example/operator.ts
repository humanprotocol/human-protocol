/* eslint-disable no-console */
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { OperatorUtils } from '../src/operator';

export const getLeaders = async () => {
  if (!NETWORKS[ChainId.POLYGON_AMOY]) {
    return;
  }

  const leaders = await OperatorUtils.getLeaders();

  console.log('Leaders:', leaders);

  const leader = await OperatorUtils.getLeader(
    ChainId.POLYGON_AMOY,
    leaders[0].address
  );

  console.log('First leader: ', leader);

  const reputationOracles = await OperatorUtils.getLeaders({
    networks: [ChainId.POLYGON_AMOY],
    role: 'Reputation Oracle',
  });

  console.log('Reputation Oracles: ', reputationOracles);
};

(async () => {
  getLeaders();
})();
