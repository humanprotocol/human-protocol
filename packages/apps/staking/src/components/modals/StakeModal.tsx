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
import { useStakeContext } from '../../contexts/stake';
import {
  useModalRequestStatus,
  ModalRequestStatus,
} from '../../hooks/useModalRequestStatus';

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
      <Typography variant="subtitle2" color="primary">
        You have successfully staked
      </Typography>
      <Typography variant="h6" color="primary">
        {amount} HMT
      </Typography>
    </Box>
  </ModalSuccess>
);

const StakeModal: FC<Props> = ({ open, onClose }) => {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const { handleStake, tokenBalance } = useStakeContext();
  const { changeStatus, isIdle, isLoading, isSuccess, isError } =
    useModalRequestStatus();

  const isStakeDisabled = !!amountError || Number(amount) <= 0 || isLoading;

  const handleClose = () => {
    if (isLoading) return;

    setAmount('');
    setAmountError('');
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
      if (isStakeDisabled) return;

      changeStatus(ModalRequestStatus.Loading);
      try {
        await handleStake(amount);
        changeStatus(ModalRequestStatus.Success);
        return;
      } catch (error) {
        console.error('Error during staking:', error);
        changeStatus(ModalRequestStatus.Error);
        return;
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setAmount(value);

    const valueInWei = parseUnits(value || '0', 'ether');
    const balanceInWei = parseUnits(tokenBalance.toString(), 'ether');

    if (valueInWei <= balanceInWei) {
      setAmountError('');
    } else {
      setAmountError('Amount exceeds available balance');
    }
  };

  const handleMaxClick = () => setAmount(tokenBalance.toString());

  const renderIdleState = () => {
    return (
      <>
        <Typography variant="subtitle2" color="primary" mb={2} py={1}>
          Available amount: {tokenBalance} HMT
        </Typography>

        <TextField
          autoFocus
          fullWidth
          label="Amount to stake"
          type="number"
          value={amount}
          onChange={handleInputChange}
          error={!!amountError}
          helperText={amountError || ' '}
          inputProps={{ max: tokenBalance, min: 0 }}
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
        Add Stake
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
        onClick={handleModalAction}
        disabled={isStakeDisabled}
      >
        {(isLoading || isSuccess) && 'Close'}
        {(isIdle || isError) && 'Add Stake'}
      </Button>
    </BaseModal>
  );
};

export default StakeModal;
