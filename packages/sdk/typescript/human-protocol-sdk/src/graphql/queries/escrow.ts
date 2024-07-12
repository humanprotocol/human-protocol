import gql from 'graphql-tag';
import { IEscrowsFilter } from '../../interfaces';

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
    manifestUrl
    recordingOracle
    recordingOracleFee
    reputationOracle
    reputationOracleFee
    exchangeOracle
    exchangeOracleFee
    status
    token
    totalFundedAmount
    createdAt
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
      ${status !== undefined ? `status: $status,` : ''}
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
      $status: String
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
