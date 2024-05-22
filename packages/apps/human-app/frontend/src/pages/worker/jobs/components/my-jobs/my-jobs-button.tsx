import { useTranslation } from 'react-i18next';
import { TableButton } from '@/components/ui/table-button';

interface MyJobsButtonProps {
  status: string;
}

export function MyJobsButton({ status }: MyJobsButtonProps) {
  // TODO add correct implementation depending on job status
  const { t } = useTranslation();
  if (status === 'RESIGN') {
    return <TableButton>{t('worker.jobs.resign')}</TableButton>;
  }
  if (status === 'ACTIVE') {
    return <TableButton>{t('worker.jobs.solve')}</TableButton>;
  }

  return <TableButton>{t('worker.jobs.solve')}</TableButton>;
}
