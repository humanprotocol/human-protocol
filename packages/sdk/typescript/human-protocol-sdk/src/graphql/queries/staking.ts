import gql from 'graphql-tag';
import { IStakersFilter } from '../../interfaces';

const STAKER_FRAGMENT = gql`
  fragment StakerFields on Staker {
    id
    address
    stakedAmount
    lockedAmount
    withdrawnAmount
    slashedAmount
    lockedUntilTimestamp
    lastDepositTimestamp
  }
`;

export const GET_STAKERS_QUERY = (filter: IStakersFilter) => {
  const {
    minStakedAmount,
    maxStakedAmount,
    minLockedAmount,
    maxLockedAmount,
    minWithdrawnAmount,
    maxWithdrawnAmount,
    minSlashedAmount,
    maxSlashedAmount,
  } = filter;

  const whereFields = [
    minStakedAmount ? `stakedAmount_gte: $minStakedAmount` : '',
    maxStakedAmount ? `stakedAmount_lte: $maxStakedAmount` : '',
    minLockedAmount ? `lockedAmount_gte: $minLockedAmount` : '',
    maxLockedAmount ? `lockedAmount_lte: $maxLockedAmount` : '',
    minWithdrawnAmount ? `withdrawnAmount_gte: $minWithdrawnAmount` : '',
    maxWithdrawnAmount ? `withdrawnAmount_lte: $maxWithdrawnAmount` : '',
    minSlashedAmount ? `slashedAmount_gte: $minSlashedAmount` : '',
    maxSlashedAmount ? `slashedAmount_lte: $maxSlashedAmount` : '',
  ].filter(Boolean);

  const WHERE_CLAUSE = whereFields.length
    ? `where: { ${whereFields.join(', ')} }`
    : '';

  return gql`
    query getStakers(
      $minStakedAmount: BigInt
      $maxStakedAmount: BigInt
      $minLockedAmount: BigInt
      $maxLockedAmount: BigInt
      $minWithdrawnAmount: BigInt
      $maxWithdrawnAmount: BigInt
      $minSlashedAmount: BigInt
      $maxSlashedAmount: BigInt
      $orderBy: String
      $orderDirection: OrderDirection
      $first: Int
      $skip: Int
    ) {
      stakers(
        ${WHERE_CLAUSE}
        orderBy: $orderBy
        orderDirection: $orderDirection
        first: $first
        skip: $skip
      ) {
        ...StakerFields
      }
    }
    ${STAKER_FRAGMENT}
  `;
};

export const GET_STAKER_BY_ADDRESS_QUERY = gql`
  query getStaker($id: String!) {
    staker(id: $id) {
      ...StakerFields
    }
  }
  ${STAKER_FRAGMENT}
`;
