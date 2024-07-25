import gql from 'graphql-tag';
import { ITransactionsFilter } from '../../../src/interfaces';

const TRANSACTION_FRAGMENT = gql`
  fragment TransactionFields on Transaction {
    block
    txHash
    from
    to
    timestamp
    value
    method
  }
`;

export const GET_TRANSACTIONS_QUERY = (filter: ITransactionsFilter) => {
  const { startDate, endDate, startBlock, endBlock, fromAddress, toAddress } =
    filter;

  const WHERE_CLAUSE = `
    where: {
      ${fromAddress ? `from: $fromAddress,` : ''}
      ${toAddress ? `to: $toAddress,` : ''}
      ${startDate ? `timestamp_gte: $startDate,` : ''}
      ${endDate ? `timestamp_lte: $endDate,` : ''}
      ${startBlock ? `block_gte: $startBlock,` : ''}
      ${endBlock ? `block_lte: $endBlock,` : ''}
    }
  `;

  return gql`
    query getTransactions(
        $fromAddress: String
        $toAddress: String
        $startDate: Int
        $endDate: Int
        $startBlock: Int
        $endBlock: Int
        $orderDirection: String
        $first: Int
        $skip: Int
    ) {
      transactions(
        ${WHERE_CLAUSE}
        orderBy: timestamp,
        orderDirection: $orderDirection,
        first: $first,
        skip: $skip
      ) {
        ...TransactionFields
      }
    }
    ${TRANSACTION_FRAGMENT}
  `;
};

export const GET_TRANSACTION_QUERY = gql`
  query getTransaction($hash: String!) {
    transaction(id: $hash) {
      ...TransactionFields
    }
  }
  ${TRANSACTION_FRAGMENT}
`;
