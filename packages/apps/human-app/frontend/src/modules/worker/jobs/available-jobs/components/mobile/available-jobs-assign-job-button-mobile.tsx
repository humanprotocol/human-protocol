import { t } from 'i18next';
import { TableButton } from '@/shared/components/ui/table-button';
import { useJobsNotifications } from '../../../hooks';
import { useAssignJobMutation } from '../../hooks/use-assign-job';
import { type AssignJobBody } from '../../../types';

export function AvailableJobsAssignJobButtonMobile({
  assignJobPayload,
}: Readonly<{
  assignJobPayload: AssignJobBody;
}>) {
  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();

  const { mutate: assignJobMutation, isPending } = useAssignJobMutation(
    {
      onSuccess: onJobAssignmentSuccess,
      onError: onJobAssignmentError,
    },
    [`assignJob-${assignJobPayload.escrow_address}`]
  );

  return (
    <TableButton
      color="secondary"
      fullWidth
      loading={isPending}
      onClick={() => {
        assignJobMutation(assignJobPayload);
      }}
      size="small"
      sx={{
        marginTop: '15px',
      }}
      type="button"
      variant="contained"
    >
      {t('worker.jobs.selectJob')}
    </TableButton>
  );
}
