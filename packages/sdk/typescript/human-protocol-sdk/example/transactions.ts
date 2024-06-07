import { ChainId } from '../src/enums';
import { TransactionUtils } from '../src/transaction';
import * as dotenv from 'dotenv';

dotenv.config({
  path: '.env',
});

export const getTransactions = async () => {
  const response = await TransactionUtils.getTransactions(
    {
      networks: [ChainId.POLYGON_AMOY],
      fromAddress: '0xF3D9a0ba9FA14273C515e519DFD0826Ff87d5164',
      startBlock: 6282708,
    },
    process.env.SUBGRAPH_API_KEY
  );

  console.log(response);
};

(async () => {
  await getTransactions();
})();
