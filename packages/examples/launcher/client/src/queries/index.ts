import { ApolloClient, InMemoryCache } from '@apollo/client';
import gql from 'graphql-tag';

export const getClient = (graphqlClientUrl: string) => {
  return new ApolloClient({
    uri: graphqlClientUrl,
    credentials: '',
    cache: new InMemoryCache(),
  });
};

export const fetchRawQuery = (graphqlClientUrl: string, query: string) => {
  return fetch(graphqlClientUrl, {
    method: 'POST',
    body: JSON.stringify({ query }),
  }).then((res) => res.json());
};

export const ESCROW_STATS_RAW = `
  query GetEscrowStatistics {
    escrowStatistics(id: "escrow-statistics-id") {
      intermediateStorageEventCount
      pendingEventCount
      bulkTransferEventCount
    }
  }
`;

export const ESCROW_STATS_QUERY = gql(ESCROW_STATS_RAW);
