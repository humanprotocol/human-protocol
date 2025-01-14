import gql from 'graphql-tag';
import { ILeadersFilter } from 'src/interfaces';

const LEADER_FRAGMENT = gql`
  fragment LeaderFields on Leader {
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
  }
`;

export const GET_LEADERS_QUERY = (filter: ILeadersFilter) => {
  const { roles, minAmountStaked } = filter;

  const WHERE_CLAUSE = `
    where: {
      ${minAmountStaked ? `amountStaked_gte: $minAmountStaked` : ''}
      ${roles ? `role_in: $roles` : ''}
    }
  `;

  return gql`
    query getLeaders(
      $minAmountStaked: Int,
      $roles: [String!]
      $first: Int
      $skip: Int
      $orderBy: String
      $orderDirection: String
    ) {
      leaders(
        ${WHERE_CLAUSE}
        first: $first
        skip: $skip
        orderBy: $orderBy
        orderDirection: $orderDirection
      ) {
        ...LeaderFields
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
          address,
          role,
          url,
          jobTypes,
          registrationNeeded,
          registrationInstructions
        }
      }
    }
  `;
};

export const GET_LEADER_QUERY = gql`
  query getLeader($address: String!) {
    leader(id: $address) {
      ...LeaderFields
    }
  }
  ${LEADER_FRAGMENT}
`;
