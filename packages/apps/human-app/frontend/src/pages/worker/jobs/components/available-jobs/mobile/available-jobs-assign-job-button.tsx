import { t } from 'i18next';
import {
  type AssignJobBody,
  useAssignJobMutation,
} from '@/api/services/worker/assign-job';
import { TableButton } from '@/components/ui/table-button';
import { useJobsNotifications } from '@/hooks/use-jobs-notifications';

export function AvailableJobsAssignJobButton({
  assignJobPayload,
}: {
  assignJobPayload: AssignJobBody;
}) {
  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();

  const { mutate: assignJobMutation, status } = useAssignJobMutation(
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
      loading={status === 'pending'}
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
