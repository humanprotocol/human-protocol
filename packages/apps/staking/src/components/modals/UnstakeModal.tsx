import { FC, ChangeEvent, useState } from 'react';
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { parseUnits } from 'ethers';

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

const SuccessState: FC<{ amount: number | string }> = ({ amount }) => (
  <ModalSuccess>
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={1}
    >
      <Typography variant="subtitle2">
        You have successfully unstaked
      </Typography>
      <Typography variant="h6">{amount} HMT</Typography>
    </Box>
  </ModalSuccess>
);

const UnstakeModal: FC<Props> = ({ open, onClose }) => {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const { stakedAmount, lockedAmount, withdrawableAmount, handleUnstake } =
    useStakeContext();
  const { changeStatus, isIdle, isLoading, isSuccess, isError } =
    useModalRequestStatus();

  const availableAmount =
    Number(stakedAmount) - Number(lockedAmount) - Number(withdrawableAmount);

  const isUnstakeDisabled = !!amountError || Number(amount) <= 0 || isLoading;

  const handleClose = () => {
    if (isLoading) return;

    setAmount('');
    setAmountError('');
    changeStatus(ModalRequestStatus.Idle);
    onClose();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setAmount(value);

    const valueInWei = parseUnits(value || '0', 'ether');
    const availableAmountInWei = parseUnits(
      availableAmount.toString(),
      'ether'
    );

    if (valueInWei <= availableAmountInWei) {
      setAmountError('');
    } else {
      setAmountError('Amount exceeds available balance');
    }
  };

  const handleMaxClick = () => setAmount(availableAmount.toString());

  const handleUnstakeClick = async () => {
    if (isError) {
      changeStatus(ModalRequestStatus.Idle);
      return;
    } else if (isSuccess) {
      handleClose();
      return;
    } else {
      if (isUnstakeDisabled) return;

      changeStatus(ModalRequestStatus.Loading);
      try {
        await handleUnstake(amount);
        changeStatus(ModalRequestStatus.Success);
        return;
      } catch (error) {
        console.error('Error during unstaking:', error);
        changeStatus(ModalRequestStatus.Error);
        return;
      }
    }
  };

  const renderIdleState = () => {
    return (
      <>
        <Typography variant="subtitle2" mb={2} py={1}>
          Available Amount: {availableAmount} HMT
        </Typography>

        <TextField
          autoFocus
          fullWidth
          label="Amount to unstake"
          type="number"
          value={amount}
          onChange={handleInputChange}
          error={!!amountError}
          helperText={amountError || ' '}
          inputProps={{ max: availableAmount, min: 0 }}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e') {
              e.preventDefault();
            }
          }}
          FormHelperTextProps={{
            sx: {
              marginTop: 0,
              height: 16,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleMaxClick}
                  sx={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    minWidth: 'unset',
                  }}
                >
                  Max
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </>
    );
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
        Unstake
      </Typography>

      {isIdle && renderIdleState()}
      {isLoading && <ModalLoading />}
      {isSuccess && <SuccessState amount={amount} />}
      {isError && <ModalError />}

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: isIdle ? 2 : 4, width: '185px' }}
        onClick={handleUnstakeClick}
        disabled={isUnstakeDisabled}
      >
        {(isLoading || isSuccess) && 'Close'}
        {(isIdle || isError) && 'Unstake'}
      </Button>
    </BaseModal>
  );
};

export default UnstakeModal;
