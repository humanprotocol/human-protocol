import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { useAppSelector } from '..';
import { JobStatus } from '../../types';

export const useJobs = ({
  status,
  chainId,
}: {
  status: JobStatus;
  chainId: ChainId;
}) => {
  const { jobs, dataLoaded, loadingFailed } = useAppSelector(
    (state) => state.jobs
  );

  return {
    data: jobs.filter(
      (job) =>
        (status === JobStatus.ALL || job.status === status) &&
        (chainId === ChainId.ALL || NETWORKS[chainId]?.title === job.network)
    ),
    isLoading: !dataLoaded && !loadingFailed,
    isError: loadingFailed,
  };
};
