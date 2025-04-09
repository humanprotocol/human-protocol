import { FC, useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

import BaseModal from './BaseModal';
import { ModalError, ModalLoading, ModalSuccess } from '../ModalState';
import {
  ModalRequestStatus,
  useModalRequestStatus,
} from '../../hooks/useModalRequestStatus';
import { useStakeContext } from '../../contexts/stake';

type Props = {
  open: boolean;
  onClose: () => void;
};

const IdleState: FC<{ withdrawableAmount: number | string }> = ({
  withdrawableAmount,
}) => (
  <>
    <Typography variant="subtitle2" color="primary" mb={1}>
      Withdraw amount:
    </Typography>
    <Typography component="p" variant="h2" color="primary">
      {withdrawableAmount} HMT
    </Typography>
  </>
);

const SuccessState: FC<{ amount: number }> = ({ amount }) => (
  <ModalSuccess>
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={1}
    >
      <Typography variant="subtitle2" color="primary">
        You have successfully withdrawn
      </Typography>
      <Typography variant="h6" color="primary">
        {amount} HMT
      </Typography>
    </Box>
  </ModalSuccess>
);

const WithdrawModal: FC<Props> = ({ open, onClose }) => {
  const { withdrawableAmount, handleWithdraw } = useStakeContext();
  const [amount, setAmount] = useState(0);
  const { changeStatus, isIdle, isLoading, isSuccess, isError } =
    useModalRequestStatus();

  const isWithdrawalDisabled = isLoading || !amount;

  useEffect(() => {
    if (withdrawableAmount && !amount) {
      setAmount(Number(withdrawableAmount));
    }
  }, [withdrawableAmount, amount]);

  const handleClose = () => {
    if (isLoading) return;

    changeStatus(ModalRequestStatus.Idle);
    onClose();
  };

  const handleModalAction = async () => {
    if (isError) {
      changeStatus(ModalRequestStatus.Idle);
      return;
    } else if (isSuccess) {
      handleClose();
      return;
    } else {
      if (isWithdrawalDisabled) return;

      changeStatus(ModalRequestStatus.Loading);
      try {
        await handleWithdraw();
        changeStatus(ModalRequestStatus.Success);
        return;
      } catch (error) {
        console.error('Error during withdrawal:', error);
        changeStatus(ModalRequestStatus.Error);
        return;
      }
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography component="h2" variant="h1" mb={2} py={1}>
        Withdraw
      </Typography>

      {isIdle && <IdleState withdrawableAmount={withdrawableAmount} />}
      {isLoading && <ModalLoading />}
      {isSuccess && <SuccessState amount={amount} />}
      {isError && <ModalError />}

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 4, width: '185px' }}
        onClick={handleModalAction}
        disabled={isWithdrawalDisabled}
      >
        {(isLoading || isSuccess) && 'Close'}
        {(isIdle || isError) && 'Withdraw'}
      </Button>
    </BaseModal>
  );
};

export default WithdrawModal;
