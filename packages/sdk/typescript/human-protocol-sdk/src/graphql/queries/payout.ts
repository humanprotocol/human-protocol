import gql from 'graphql-tag';
import { IPayoutFilter } from '../../interfaces';

const PAYOUT_FRAGMENT = gql`
  fragment PayoutFields on Payout {
    id
    escrowAddress
    recipient
    amount
    createdAt
  }
`;

export const GET_PAYOUTS_QUERY = (filter: IPayoutFilter) => {
  const { escrowAddress, recipient, from, to } = filter;

  const WHERE_CLAUSE = `
    where: {
      ${escrowAddress ? `escrowAddress: $escrowAddress` : ''}
      ${recipient ? `recipient: $recipient` : ''}
      ${from ? `createdAt_gte: $from` : ''}
      ${to ? `createdAt_lt: $to` : ''}
    }
  `;
  const LIMIT_CLAUSE = `
    first: 1000
  `;

  return gql`
    query getPayouts(
      $escrowAddress: String
      $recipient: String
      $from: Int
      $to: Int
    ) {
      payouts(
        ${WHERE_CLAUSE}
        orderBy: createdAt,
        orderDirection: desc,
        ${LIMIT_CLAUSE}
      ) {
        ...PayoutFields
      }
    }
    ${PAYOUT_FRAGMENT}
  `;
};
