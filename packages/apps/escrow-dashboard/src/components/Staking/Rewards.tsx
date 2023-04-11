import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  Link,
  NativeSelect,
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
  const [mode, setMode] = useState<Mode>();
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
              <ToggleButton color="primary" value="stake">
                Claim Rewards
              </ToggleButton>
              <ToggleButton color="primary" value="unstake">
                Reinvest Rewards
              </ToggleButton>
            </ToggleButtonGroup>
            <Box mt={4} mb={5}>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel variant="standard" htmlFor="network-selector">
                      Network
                    </InputLabel>
                    <NativeSelect
                      defaultValue={30}
                      inputProps={{
                        name: 'network',
                        id: 'network-selector',
                      }}
                    >
                      <option value={10}>Polygon</option>
                      <option value={20}>BSC</option>
                      <option value={30}>Avalanche</option>
                    </NativeSelect>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            <CurrencyInput placeholder="Enter amount to claim" />
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
