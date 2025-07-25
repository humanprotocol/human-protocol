import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TableButton } from '@/shared/components/ui/table-button';
import { MyJobStatus } from '../types';
import { type MyJob } from '../schemas';
import { MoreButton } from './more-button';

interface MyJobsTableRejectActionProps {
  job: MyJob;
}

export function MyJobsTableActions({
  job,
}: Readonly<MyJobsTableRejectActionProps>) {
  const { t } = useTranslation();
  const isDisabled = job.status !== MyJobStatus.ACTIVE;

  if (!job.url) {
    return null;
  }

  return (
    <>
      <TableButton
        component={Link}
        disabled={isDisabled}
        fullWidth
        target="_blank"
        to={job.url}
        sx={{
          height: { xs: '48px', md: '30px' },
          maxWidth: { xs: 'unset', sm: '160px' },
          flex: { xs: 1, md: 'unset' },
        }}
      >
        {t('worker.jobs.solve')}
      </TableButton>
      <MoreButton job={job} isDisabled={isDisabled} />
    </>
  );
}
