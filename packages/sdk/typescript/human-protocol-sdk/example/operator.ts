/* eslint-disable no-console */
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { IOperatorsFilter } from '../src/interfaces';
import { OperatorUtils } from '../src/operator';

export const getOperators = async () => {
  if (!NETWORKS[ChainId.POLYGON_AMOY]) {
    return;
  }

  const filter: IOperatorsFilter = {
    chainId: ChainId.POLYGON_AMOY,
  };

  const operators = await OperatorUtils.getOperators(filter);

  console.log('Operators:', operators);

  const operator = await OperatorUtils.getOperator(
    ChainId.POLYGON_AMOY,
    operators[0].address
  );

  console.log('First operator: ', operator);

  const reputationOracles = await OperatorUtils.getOperators({
    chainId: ChainId.POLYGON_AMOY,
    roles: ['ReputationOracle'],
  });

  console.log('Reputation Oracles: ', reputationOracles);
};

(async () => {
  getOperators();
})();
