import { FC } from 'react';

import BaseModal from './BaseModal';
import { Button, Box, Typography } from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirmSave: () => void;
};

const SaveConfirmationModal: FC<Props> = ({ open, onClose, onConfirmSave }) => {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      sx={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="h2" mb={2} p={1}>
        Delete Key/Value
      </Typography>
      <Typography variant="subtitle2" mb={4} p={1}>
        You are about to delete a Key/Value from your KV Store. <br />
        After you save this action can&apos;t be undone, do you want to
        continue?
      </Typography>
      <Box display="flex" gap={1}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onConfirmSave}>
          Save
        </Button>
      </Box>
    </BaseModal>
  );
};

export default SaveConfirmationModal;
