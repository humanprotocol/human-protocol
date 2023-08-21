import gql from 'graphql-tag';

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
    status
    token
    totalFundedAmount
  }
`;

export const GET_ESCROWS_BY_LAUNCHER_QUERY = gql`
  query GetEscrowByLauncher($launcherAddress: String!) {
    escrows(where: { launcher: $launcherAddress }) {
      ...EscrowFields
    }
  }
  ${ESCROW_FRAGMENT}
`;

export const GET_FILTERED_ESCROWS_QUERY = gql`
  query GetFilteredEscrows(
    $launcherAddress: String
    $status: EscrowStatus
    $from: Int
    $to: Int
  ) {
    escrows(
      where: {
        launcher: $launcherAddress
        status: $status
        createdAt_gte: $from
        createdAt_lte: $to
      }
    ) {
      ...EscrowFields
    }
  }
  ${ESCROW_FRAGMENT}
`;
