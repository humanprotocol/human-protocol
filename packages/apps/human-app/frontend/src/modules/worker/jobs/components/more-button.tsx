/* eslint-disable camelcase -- ...*/
import { useState } from 'react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, MenuList, ListItemButton, Popover } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useModal } from '@/shared/contexts/modal-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useResignJobMutation } from '../my-jobs/hooks';
import { type MyJob } from '../schemas';
import { ReportAbuseModal } from './report-abuse-modal';

interface MoreButtonProps {
  job: MyJob;
  isDisabled: boolean;
}

export function MoreButton({ job, isDisabled }: Readonly<MoreButtonProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { address: oracleAddress } = useParams<{ address: string }>();
  const { mutate: rejectTaskMutation } = useResignJobMutation();
  const { openModal, closeModal } = useModal();
  const isMobile = useIsMobile();

  const isOpen = Boolean(anchorEl);

  const handleCancelTask = () => {
    setAnchorEl(null);
    rejectTaskMutation({
      oracle_address: oracleAddress ?? '',
      assignment_id: job.assignment_id,
    });
  };

  const handleOpenReportAbuseModal = () => {
    setAnchorEl(null);
    openModal({
      content: (
        <ReportAbuseModal
          close={closeModal}
          escrowAddress={job.escrow_address}
          chainId={job.chain_id}
        />
      ),
      showCloseButton: false,
    });
  };

  return (
    <>
      <Button
        disabled={isDisabled}
        sx={{
          minWidth: 'unset',
          width: { xs: '48px', md: '30px' },
          height: { xs: '48px', md: '30px' },
          p: 1,
          border: isMobile ? '1px solid #858EC6' : 'none',
          borderRadius: '4px',
        }}
        onClick={(e) => {
          !isDisabled && setAnchorEl(e.currentTarget);
        }}
      >
        <MoreHorizIcon sx={{ color: '#858EC6' }} />
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
            sx: {
              mt: isMobile ? 0 : 1,
            },
          },
        }}
      >
        <MenuList>
          <ListItemButton onClick={handleCancelTask}>Cancel</ListItemButton>
          <ListItemButton onClick={handleOpenReportAbuseModal}>
            Report Abuse
          </ListItemButton>
        </MenuList>
      </Popover>
    </>
  );
}
