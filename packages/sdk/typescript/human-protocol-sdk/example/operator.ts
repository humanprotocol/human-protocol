/* eslint-disable no-console */
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { IOperatorsFilter } from '../src/interfaces';
import { OperatorUtils } from '../src/operator';

export const getOperators = async () => {
  if (!NETWORKS[ChainId.LOCALHOST]) {
    return;
  }

  const filter: IOperatorsFilter = {
    chainId: ChainId.LOCALHOST,
  };

  const operators = await OperatorUtils.getOperators(filter);

  console.log('Operators:', operators);

  const operator = await OperatorUtils.getOperator(
    ChainId.LOCALHOST,
    operators[0].address
  );

  console.log('First operator: ', operator);

  const reputationOracles = await OperatorUtils.getOperators({
    chainId: ChainId.LOCALHOST,
    roles: ['ReputationOracle'],
  });

  console.log('Reputation Oracles: ', reputationOracles);
};

(async () => {
  getOperators();
})();
