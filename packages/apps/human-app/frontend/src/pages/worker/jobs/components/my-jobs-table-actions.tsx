/* eslint-disable camelcase -- ...*/
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRejectTaskMutation } from '@/api/services/worker/reject-task';
import { TableButton } from '@/components/ui/table-button';
import { RejectButton } from '@/pages/worker/jobs/components/reject-button';
import type { MyJob } from '@/api/services/worker/my-jobs-data';

interface MyJobsTableRejectActionProps {
  job: MyJob;
}

export function MyJobsTableActions({ job }: MyJobsTableRejectActionProps) {
  const { t } = useTranslation();
  const { mutate: rejectTaskMutation, isPending: isRejectPending } =
    useRejectTaskMutation();
  const { address: oracleAddress } = useParams<{ address: string }>();
  const buttonDisabled = job.status !== 'ACTIVE' || isRejectPending;

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
