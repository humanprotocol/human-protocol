import gql from 'graphql-tag';

const HOLDER_FRAGMENT = gql`
  fragment HolderFields on Holder {
    address
    balance
  }
`;

export const GET_HOLDERS_QUERY = (address?: string) => {
  const WHERE_CLAUSE = `
    where: {
      ${address ? `address: $address,` : ''}
    }
  `;

  return gql`
    query GetHolders(
      $address: String
      $orderBy: String
      $orderDirection: String
    ) {
      holders(
        ${WHERE_CLAUSE}
        orderBy: $orderBy,
        orderDirection: $orderDirection
      ) {
        ...HolderFields
      }
    }
    ${HOLDER_FRAGMENT}
  `;
};
