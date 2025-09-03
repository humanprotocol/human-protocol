import gql from 'graphql-tag';
import { ICancellationRefundFilter, IEscrowsFilter } from '../../interfaces';

const ESCROW_FRAGMENT = gql`
  fragment EscrowFields on Escrow {
    address
    amountPaid
    balance
    count
    factoryAddress
    finalResultsUrl
    id
    intermediateResultsUrl
    jobRequesterId
    launcher
    manifestHash
    manifest
    recordingOracle
    reputationOracle
    exchangeOracle
    status
    token
    totalFundedAmount
    createdAt
  }
`;

const CANCELLATION_REFUND_FRAGMENT = gql`
  fragment CancellationRefundFields on CancellationRefundEvent {
    id
    escrowAddress
    receiver
    amount
    block
    timestamp
    txHash
  }
`;

export const GET_ESCROW_BY_ADDRESS_QUERY = () => gql`
  query getEscrowByAddress($escrowAddress: String!) {
    escrow(id: $escrowAddress) {
      ...EscrowFields
    }
  }
  ${ESCROW_FRAGMENT}
`;

export const GET_ESCROWS_QUERY = (filter: IEscrowsFilter) => {
  const {
    launcher,
    jobRequesterId,
    reputationOracle,
    recordingOracle,
    exchangeOracle,
    status,
    from,
    to,
  } = filter;

  const WHERE_CLAUSE = `
    where: {
      ${launcher ? `launcher: $launcher,` : ''}
      ${jobRequesterId ? `jobRequesterId: $jobRequesterId,` : ''}
      ${reputationOracle ? `reputationOracle: $reputationOracle,` : ''}
      ${recordingOracle ? `recordingOracle: $recordingOracle,` : ''}
      ${exchangeOracle ? `exchangeOracle: $exchangeOracle,` : ''}
      ${status !== undefined ? `status_in: $status,` : ''}
      ${from ? `createdAt_gte: $from,` : ''}
      ${to ? `createdAt_lte: $to,` : ''}
    }
  `;

  return gql`
    query getEscrows(
      $launcher: String
      $jobRequesterId: String
      $reputationOracle: String
      $recordingOracle: String
      $exchangeOracle: String
      $status: [String!]
      $from: Int
      $to: Int
      $orderDirection: String
      $first: Int
      $skip: Int
    ) {
      escrows(
        ${WHERE_CLAUSE}
        orderBy: createdAt,
        orderDirection: $orderDirection,
        first: $first,
        skip: $skip
      ) {
        ...EscrowFields
      }
    }
    ${ESCROW_FRAGMENT}
  `;
};

export const GET_STATUS_UPDATES_QUERY = (
  from?: Date,
  to?: Date,
  launcher?: string
) => {
  const WHERE_CLAUSE = `
    where: {
      status_in: $status
      ${from ? `timestamp_gte: $from` : ''}
      ${to ? `timestamp_lte: $to` : ''}
      ${launcher ? `launcher: $launcher` : ''}
    }
  `;
  return gql`
    query getStatus(
      $status: [String!]!
      $from: Int
      $to: Int
      $launcher: String
      $orderDirection: String
      $first: Int
      $skip: Int
    ) {
      escrowStatusEvents(
        ${WHERE_CLAUSE}
        orderBy: timestamp,
        orderDirection: $orderDirection,
        first: $first,
        skip: $skip
      ) {
        escrowAddress,
        timestamp,
        status,
      }
    }
  `;
};

export const GET_CANCELLATION_REFUNDS_QUERY = (
  filter: ICancellationRefundFilter
) => gql`
  query CancellationRefundEvents(
    $escrowAddress: Bytes
    $receiver: Bytes
    $from: Int
    $to: Int
    $first: Int
    $skip: Int
    $orderDirection: OrderDirection
  ) {
    cancellationRefundEvents(
      where: {
        ${filter.escrowAddress ? 'escrowAddress: $escrowAddress' : ''}
        ${filter.receiver ? 'receiver: $receiver' : ''}
        ${filter.from ? 'timestamp_gte: $from' : ''}
        ${filter.to ? 'timestamp_lte: $to' : ''}
      }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: $orderDirection
    ) {
      ...CancellationRefundFields
    }
  }
  ${CANCELLATION_REFUND_FRAGMENT}
`;

export const GET_CANCELLATION_REFUND_BY_ADDRESS_QUERY = () => gql`
  query getCancellationRefundByAddress($escrowAddress: String!) {
    cancellationRefundEvents(where: { escrowAddress: $escrowAddress }) {
      ...CancellationRefundFields
    }
  }
  ${CANCELLATION_REFUND_FRAGMENT}
`;
