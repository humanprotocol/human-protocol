/* eslint-disable camelcase -- ...*/
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TableButton } from '@/shared/components/ui/table-button';
import { useRejectTaskMutation } from '../my-jobs/hooks';
import { MyJobStatus } from '../types';
import { type MyJob } from './my-jobs-data';
import { RejectButton } from './reject-button';

interface MyJobsTableRejectActionProps {
  job: MyJob;
}

export function MyJobsTableActions({
  job,
}: Readonly<MyJobsTableRejectActionProps>) {
  const { t } = useTranslation();
  const { mutate: rejectTaskMutation, isPending: isRejectPending } =
    useRejectTaskMutation();
  const { address: oracleAddress } = useParams<{ address: string }>();
  const buttonDisabled = job.status !== MyJobStatus.ACTIVE || isRejectPending;

  if (!job.url) {
    return null;
  }

  return (
    <>
      <TableButton
        component={Link}
        disabled={buttonDisabled}
        fullWidth
        target="_blank"
        to={job.url}
        sx={{ maxWidth: { xs: 'unset', sm: '160px' } }}
      >
        {t('worker.jobs.solve')}
      </TableButton>
      <RejectButton
        disabled={buttonDisabled}
        loading={isRejectPending}
        onClick={() => {
          rejectTaskMutation({
            oracle_address: oracleAddress ?? '',
            assignment_id: job.assignment_id,
          });
        }}
      />
    </>
  );
}
