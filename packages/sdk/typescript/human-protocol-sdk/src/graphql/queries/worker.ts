import gql from 'graphql-tag';
import { IWorkersFilter } from '../../interfaces';

export const GET_WORKER_QUERY = gql`
  query GetWorker($address: String!) {
    worker(id: $address) {
      id
      address
      totalAmountReceived
      payoutCount
    }
  }
`;

export const GET_WORKERS_QUERY = (filter: IWorkersFilter) => {
  const { address } = filter;

  return gql`
  query GetWorkers(
    $address: String
    $first: Int
    $skip: Int
  ) {
    workers(
      where: {
        ${address ? 'address: $address,' : ''}
      }
      first: $first
      skip: $skip
    ) {
      id
      address
      totalAmountReceived
      payoutCount
    }
  }`;
};
