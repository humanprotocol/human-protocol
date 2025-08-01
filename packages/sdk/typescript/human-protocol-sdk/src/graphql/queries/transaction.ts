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
    receiver
    escrow
    token
    internalTransactions {
      from
      id
      to
      value
      receiver
      escrow
      token
      method
    }
  }
`;

export const GET_TRANSACTIONS_QUERY = (filter: ITransactionsFilter) => {
  const {
    startDate,
    endDate,
    startBlock,
    endBlock,
    fromAddress,
    toAddress,
    method,
    escrow,
    token,
  } = filter;
  const addressCondition =
    fromAddress === toAddress
      ? `
        ${fromAddress ? `{ from: $fromAddress }` : ''}
        ${toAddress ? `{ or: [{ or: [{ to: $toAddress }, { receiver: $toAddress }] }, {internalTransactions_: { or: [{ to: $toAddress }, { receiver: $toAddress }] } }] }` : ''}
      `
      : `
        ${fromAddress ? `{ from: $fromAddress }` : ''}
        ${toAddress ? `{ or: [{ or: [{ to: $toAddress }, { receiver: $toAddress }] }, { internalTransactions_: { or: [{ to: $toAddress }, { receiver: $toAddress }] } }] }` : ''}
      `;

  const WHERE_CLAUSE = `
      where: {
      and: [
        ${fromAddress && fromAddress === toAddress ? `{or: [ ${addressCondition} ]},` : `${addressCondition}`}
        ${startDate ? `{timestamp_gte: $startDate},` : ''}
        ${endDate ? `{timestamp_lte: $endDate},` : ''}
        ${startBlock ? `{block_gte: $startBlock},` : ''}
        ${endBlock ? `{block_lte: $endBlock},` : ''}
        ${method ? `{ method: $method },` : ''}
        ${escrow ? `{ escrow: $escrow },` : ''}
        ${token ? `{ token: $token },` : ''}
      ]
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
        $method: String
        $escrow: String
        $token: String
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
