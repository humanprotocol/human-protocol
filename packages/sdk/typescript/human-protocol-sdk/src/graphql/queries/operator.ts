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
    url
    jobTypes
    registrationNeeded
    registrationInstructions
    reputationNetworks {
      address
    }
  }
`;

export const GET_LEADERS_QUERY = (filter: ILeadersFilter) => {
  const { role } = filter;

  const WHERE_CLAUSE = `
    where: {
      ${role ? `role: $role` : ''}
    }
  `;

  return gql`
    query getLeaders(
      $role: String
    ) {
      leaders(
        ${WHERE_CLAUSE}
        orderBy: amountStaked,
        orderDirection: desc,
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
