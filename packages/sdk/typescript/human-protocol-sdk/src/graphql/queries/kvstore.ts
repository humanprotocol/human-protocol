import gql from 'graphql-tag';

const KVSTORE_FRAGMENT = gql`
  fragment KVStoreFields on KVStore {
    id
    block
    timestamp
    address
    key
    value
  }
`;

export const GET_KVSTORE_BY_ADDRESS_QUERY = () => {
  return gql`
    query getKVStoreData($address: String!) {
      kvstores(where: { address: $address }) {
        ...KVStoreFields
      }
    }
    ${KVSTORE_FRAGMENT}
  `;
};
