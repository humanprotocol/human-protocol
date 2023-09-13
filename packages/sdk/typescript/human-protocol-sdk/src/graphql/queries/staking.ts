import gql from 'graphql-tag';
import { ILeadersFilter } from 'src/interfaces';

const LEADER_FRAGMENT = gql`
  fragment LeaderFields on Leader {
    id
    address
    amountStaked
    amountAllocated
    amountLocked
    lockedUntilTimestamp
    amountWithdrawn
    amountSlashed
    reputation
    reward
    amountJobsLaunched
    role
    fee
    publicKey
    webhookUrl
    url
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

export const GET_LEADER_QUERY = gql`
  query getLeader($address: String!) {
    leader(id: $address) {
      ...LeaderFields
    }
  }
  ${LEADER_FRAGMENT}
`;
