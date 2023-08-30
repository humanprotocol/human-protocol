import gql from 'graphql-tag';

const HOLDER_FRAGMENT = gql`
  fragment HolderFields on Holder {
    address
    balance
  }
`;

export const GET_HOLDERS_QUERY = gql`
  query GetHolders {
    holders {
      ...HolderFields
    }
  }
  ${HOLDER_FRAGMENT}
`;
