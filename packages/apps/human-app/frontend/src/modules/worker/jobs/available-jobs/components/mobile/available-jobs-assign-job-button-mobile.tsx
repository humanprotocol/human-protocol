import { t } from 'i18next';
import { useParams } from 'react-router-dom';
import { TableButton } from '@/shared/components/ui/table-button';
import { useJobsNotifications } from '../../../hooks';
import { useAssignJobMutation } from '../../hooks/use-assign-job';
import { type AssignJobBody } from '../../../types';
import { useAddThirstyfiInfoModal } from '../../hooks/use-add-thirstyfi-info-modal';

const THIRSTYFI_ADDRESS = '0x5C08438d7d18734c5ee42ECAf81FB1D6A922A9cC';

export function AvailableJobsAssignJobButtonMobile({
  assignJobPayload,
}: Readonly<{
  assignJobPayload: AssignJobBody;
}>) {
  const { address: oracleAddress } = useParams<{ address: string }>();
  const { openModal } = useAddThirstyfiInfoModal();
  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();

  const { mutate: assignJobMutation, isPending } = useAssignJobMutation(
    {
      onSuccess: onJobAssignmentSuccess,
      onError: onJobAssignmentError,
    },
    [`assignJob-${assignJobPayload.escrow_address}`]
  );

  const isThirstyfi = oracleAddress === THIRSTYFI_ADDRESS;

  return (
    <TableButton
      color="secondary"
      fullWidth
      loading={isPending}
      onClick={() => {
        if (isThirstyfi) {
          openModal({ ...assignJobPayload });
        } else {
          assignJobMutation(assignJobPayload);
        }
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
