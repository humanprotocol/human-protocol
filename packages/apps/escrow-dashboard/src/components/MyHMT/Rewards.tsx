import {
  Box,
  Button,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { FC, useState } from 'react';
import { Container } from '../Cards/Container';
import { CurrencyInput } from './CurrencyInput';

type RewardsProps = {};

type Mode = 'claim' | 'reinvest';

export const Rewards: FC<RewardsProps> = () => {
  const [mode, setMode] = useState<Mode>('claim');
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <Container>
      {!isSuccess ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'space-between',
            height: '100%',
          }}
        >
          <Box mb={3}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, newMode) => setMode(newMode)}
              fullWidth
            >
              <ToggleButton color="primary" value="claim">
                Claim Rewards
              </ToggleButton>
              <ToggleButton color="primary" value="reinvest">
                Reinvest Rewards
              </ToggleButton>
            </ToggleButtonGroup>
            <Box my={4}>
              <CurrencyInput placeholder="Enter amount to claim" />
            </Box>
          </Box>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            sx={{ mt: 'auto', p: 1, fontWeight: 600 }}
            onClick={() => setIsSuccess(true)}
          >
            Confirm
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
          }}
        >
          <Typography
            color="primary"
            variant="h6"
            fontWeight={500}
            gutterBottom
          >
            Success!
          </Typography>
          <Typography color="primary" variant="body2" textAlign="center" mt={2}>
            Congratulations, you have successfully claimed 1000 HMT on the
            Network 1.
          </Typography>
          <Typography color="primary" variant="body2" fontWeight={600} mt={4}>
            Check transaction{' '}
            <Link href="https://etherscan.io" target="_blank">
              here
            </Link>
          </Typography>
        </Box>
      )}
    </Container>
  );
};
