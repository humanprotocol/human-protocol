import { ApolloClient, InMemoryCache } from '@apollo/client';
import { Web3Provider } from '@ethersproject/providers';

export const getLibrary = (provider: any) => {
  return new Web3Provider(provider);
};

export const getClient = (graphqlClientUrl: string) => {
  return new ApolloClient({
    uri: graphqlClientUrl,
    credentials: '',
    cache: new InMemoryCache(),
  });
};
