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
      ${launcher ? `launcher: $launcher` : ''}
      ${jobRequesterId ? `jobRequesterId: $jobRequesterId` : ''}
      ${reputationOracle ? `reputationOracle: $reputationOracle` : ''}
      ${recordingOracle ? `recordingOracle: $recordingOracle` : ''}
      ${exchangeOracle ? `exchangeOracle: $exchangeOracle` : ''}
      ${status !== undefined ? `status: $status` : ''}
      ${from ? `createdAt_gte: $from` : ''}
      ${to ? `createdAt_lte: $to` : ''}
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
    ) {
      escrows(
        ${WHERE_CLAUSE}
      ) {
        ...EscrowFields
      }
    }
    ${ESCROW_FRAGMENT}
  `;
};

export const GET_STATUS_UPDATES_QUERY = (
  status: string,
  from?: Date,
  to?: Date
) => {
  const WHERE_CLAUSE = `
    where: {
      ${from ? `timestamp_gte: $from` : ''}
      ${to ? `timestamp_lte: $to` : ''}
    }
  `;
  return gql`
    query getStatus(
      $from: Int
      $to: Int
    ) {
      ${status}StatusEvents(
        ${WHERE_CLAUSE}
      ) {
        escrowAddress,
        timestamp,
      }
    }
  `;
};
