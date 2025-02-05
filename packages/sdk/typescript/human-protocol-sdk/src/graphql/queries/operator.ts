import gql from 'graphql-tag';
import { IOperatorsFilter } from 'src/interfaces';

const LEADER_FRAGMENT = gql`
  fragment OperatorFields on Operator {
    id
    address
    amountStaked
    amountLocked
    lockedUntilTimestamp
    amountWithdrawn
    amountSlashed
    reward
    amountJobsProcessed
    role
    fee
    publicKey
    webhookUrl
    website
    url
    jobTypes
    registrationNeeded
    registrationInstructions
    reputationNetworks
    name
    category
  }
`;

export const GET_LEADERS_QUERY = (filter: IOperatorsFilter) => {
  const { roles, minAmountStaked } = filter;

  const WHERE_CLAUSE = `
    where: {
      ${minAmountStaked ? `amountStaked_gte: $minAmountStaked` : ''}
      ${roles ? `role_in: $roles` : ''}
    }
  `;

  return gql`
    query getOperators(
      $minAmountStaked: Int,
      $roles: [String!]
      $first: Int
      $skip: Int
      $orderBy: String
      $orderDirection: String
    ) {
      operators(
        ${WHERE_CLAUSE}
        first: $first
        skip: $skip
        orderBy: $orderBy
        orderDirection: $orderDirection
      ) {
        ...OperatorFields
      }
    }
    ${LEADER_FRAGMENT}
  `;
};

export const GET_REPUTATION_NETWORK_QUERY = (role?: string) => {
  const WHERE_CLAUSE = `
    where: {
      ${role ? `role: $role` : ''}
    }
  `;

  return gql`
    query getReputationNetwork(
      $address: String,
      $role: String
    ) {
      reputationNetwork(id: $address) {
        operators(
          ${WHERE_CLAUSE}
        ) {
          ...OperatorFields
        }
      }
    }
    ${LEADER_FRAGMENT}
  `;
};

export const GET_LEADER_QUERY = gql`
  query getOperator($address: String!) {
    operator(id: $address) {
      ...OperatorFields
    }
  }
  ${LEADER_FRAGMENT}
`;
