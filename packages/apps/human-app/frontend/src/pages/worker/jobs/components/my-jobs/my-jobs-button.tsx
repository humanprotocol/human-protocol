import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';

interface MyJobsButtonProps {
  status: string;
}

export function MyJobsButton({ status }: MyJobsButtonProps) {
  const { t } = useTranslation();
  if (status === 'RESIGN') {
    return (
      <Button color="primary" size="small" type="button" variant="contained">
        {t('worker.jobs.resign')}
      </Button>
    );
  }
  if (status === 'ACTIVE') {
    return (
      <Button color="secondary" size="small" type="button" variant="contained">
        {t('worker.jobs.solve')}
      </Button>
    );
  }

  return (
    <Button
      size="small"
      sx={{
        backgroundColor: colorPalette.paper.disabled,
        color: colorPalette.paper.text,
        boxShadow: 'none',
        px: '10px',
        py: '4px',
      }}
      type="button"
      variant="contained"
    >
      {t('worker.jobs.solve')}
    </Button>
  );
}
