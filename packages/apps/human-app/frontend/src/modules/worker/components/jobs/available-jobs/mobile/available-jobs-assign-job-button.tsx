import { t } from 'i18next';
import {
  type AssignJobBody,
  useAssignJobMutation,
} from '@/modules/worker/services/use-assign-job';
import { TableButton } from '@/shared/components/ui/table-button';
import { useJobsNotifications } from '@/modules/worker/hooks/use-jobs-notifications';

export function AvailableJobsAssignJobButton({
  assignJobPayload,
}: {
  assignJobPayload: AssignJobBody;
}) {
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
