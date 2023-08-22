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

export const GET_ESCROWS_QUERY = gql`
  query GetEscrows(
    $launcherAddress: String
    $reputationOracle: String
    $recordingOracle: String
    $status: EscrowStatus
    $from: Int
    $to: Int
  ) {
    escrows(
      where: {
        launcher: $launcherAddress
        reputationOracle: $reputationOracle
        recordingOracle: $recordingOracle
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
