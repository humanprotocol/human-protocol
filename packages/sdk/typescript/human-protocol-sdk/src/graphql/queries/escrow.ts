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
    escrow(where: { address: $escrowAddress }) {
      ...EscrowFields
    }
  }
  ${ESCROW_FRAGMENT}
`;

export const GET_ESCROWS_QUERY = (filter: IEscrowsFilter) => {
  const {
    launcher,
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
      ${reputationOracle ? `reputationOracle: $reputationOracle` : ''}
      ${recordingOracle ? `recordingOracle: $recordingOracle` : ''}
      ${exchangeOracle ? `exchangeOracle: $exchangeOracle` : ''}
      ${status ? `status: $status` : ''}
      ${from ? `createdAt_gte: $from` : ''}
      ${to ? `createdAt_lte: $to` : ''}
    }
  `;

  return gql`
    query getEscrows(
      $launcher: String
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
