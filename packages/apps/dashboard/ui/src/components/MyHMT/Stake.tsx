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

type StakeProps = {};

type Mode = 'stake' | 'unstake';

export const Stake: FC<StakeProps> = () => {
  const [mode, setMode] = useState<Mode>('stake');
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
          <Box>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, newMode) => setMode(newMode)}
              fullWidth
            >
              <ToggleButton color="primary" value="stake">
                Stake HMT
              </ToggleButton>
              <ToggleButton color="primary" value="unstake">
                Unstake HMT
              </ToggleButton>
            </ToggleButtonGroup>
            <Box my={4}>
              <CurrencyInput placeholder="Enter amount to stake" />
            </Box>
            <Box my={3}>
              <Typography
                color="primary"
                textAlign="center"
                mb={1.5}
                variant="caption"
                component="p"
              >
                Network address: 0xa9fbD31cd4EAA938Fc90A31eFe231316444a1102
              </Typography>
              <Typography
                color="primary"
                textAlign="center"
                variant="caption"
                component="p"
              >
                Staking amount: 0.00 HMT
              </Typography>
            </Box>
          </Box>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            sx={{ p: 1, fontWeight: 600 }}
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
            Congratulations, you have successfully staked 1000 HMT on the
            Network 1 to the role of Job Launcher.
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
