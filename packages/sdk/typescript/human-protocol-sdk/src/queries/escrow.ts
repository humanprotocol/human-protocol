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
