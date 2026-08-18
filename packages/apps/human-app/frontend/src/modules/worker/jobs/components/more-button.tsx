import { useState } from 'react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, MenuList, ListItemButton, Popover } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { TopNotificationType, useNotification } from '@/shared/hooks';
import { useResignJobMutation } from '../my-jobs/hooks';
import { type MyJob } from '../schemas';
import { useMyJobsFilterStore } from '../hooks';
import { ReportAbuseDialog } from './report-abuse-dialog';

interface MoreButtonProps {
  job: MyJob;
  isDisabled: boolean;
}

export function MoreButton({ job, isDisabled }: MoreButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { showNotification } = useNotification();

  const { filterParams } = useMyJobsFilterStore();
  const { mutateAsync: rejectTaskMutation } = useResignJobMutation();

  const isOpen = Boolean(anchorEl);

  const handleCancelTask = async () => {
    setAnchorEl(null);
    try {
      await rejectTaskMutation({
        oracle_address: filterParams.oracle_address ?? '',
        assignment_id: job.assignment_id,
      });
    } catch {
      showNotification({
        message: 'Something went wrong',
        type: TopNotificationType.WARNING,
        durationMs: 5000,
      });
    }
  };

  const handleOpenReportAbuseModal = () => {
    setAnchorEl(null);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Button
        disabled={isDisabled}
        sx={{
          minWidth: 'unset',
          width: { xs: '44px', md: '30px' },
          height: { xs: '44px', md: '30px' },
          p: 1,
          border: (theme) => ({
            xs: `1px solid ${theme.palette.border.main}`,
            md: 'none',
          }),
          borderRadius: '4px',
          color: 'text.auxiliary100',
        }}
        onClick={(e) => {
          if (!isDisabled) {
            setAnchorEl(e.currentTarget);
          }
        }}
      >
        <MoreHorizIcon />
      </Button>
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: isMobile ? 'top' : 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: isMobile ? 'bottom' : 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: { xs: -1, md: 1 },
            },
          },
        }}
      >
        <MenuList>
          <ListItemButton onClick={() => void handleCancelTask()}>
            {t('worker.reportAbuse.cancel')}
          </ListItemButton>
          <ListItemButton onClick={handleOpenReportAbuseModal}>
            {t('worker.reportAbuse.reportAbuse')}
          </ListItemButton>
        </MenuList>
      </Popover>
      <ReportAbuseDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        escrowAddress={job.escrow_address}
        chainId={job.chain_id}
      />
    </>
  );
}
